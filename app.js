const dataManager = require('./data/datamanager.js');
const { App } = require('@slack/bolt');
const express = require('express');

const { createHash } = require('crypto');
const { create } = require('domain');

// Load ENV
require('dotenv').config();


createHash('sha256').update('bacon').digest('base64');

const app = new App({
    token: process.env.SLACK_AUTH_SECRET,
    signingSecret: process.env.SLACK_SIGNING_SECRET
});

function getUserData(user) {
    if (!dataManager.recordExists(user["id"])) {
        dataManager.addRecord(user["id"], { "found": 0, "username": user["name"], "id": user["id"]});
    }
    return dataManager.getRecord(user["id"]);
}

async function foundKey(user, say){
    let record = getUserData(user)
    console.log("Record: ", record)
    let numKeysFound = record["found"];
    await say(`Awesome! You have found ${numKeysFound} keys.`);
    numKeysFound++;
    dataManager.updateRecord(user["id"], { "found": numKeysFound, "username": user["name"], "id": user["id"]});
}
app.event('app_mention', async ({ event, say }) => {
    try{
        const userID = event.user;
        const userInfo = await app.client.users.info({ user: userID });
        const username = userInfo.user.name;
        if (event.text.toLowerCase().includes('i found a key!')) {

            await foundKey({'id': userID, 'name': username}, say); 
        }
        else if (event.text.toLowerCase().includes('leaderboard please!')){
            dataManager.backupAllRecords();
            const records = dataManager.getAllRecords();
            let leaderboard = "Leaderboard:\n";
            records.sort((a, b) => b["found"] - a["found"]);
            let i = 0;
            for (let record of records){
                leaderboard += `${i+1}. <@${record["id"]}> has found ${record["found"]} keys\n`;
                i++;
            }
            await say(leaderboard);
        }
        else if (event.text.toLowerCase().includes('help')){
            await say("To report a found key, mention me and say 'I found a key!'.\n To see the leaderboard, mention me and say 'Leaderboard please!'\nTo see this message, mention me and say 'help'");
        } else if (event.text.toLowerCase().includes('i exist!')){
            if(!dataManager.recordExists(userID)){
                await say(`<@${userID}> now exists! :)`);
                dataManager.addRecord(userID, { "found": 0, "username": username, "id": userID});
            }
            else {
                await say(`<@${userID}> already exists!`);
            }
        }
    }
    catch (error) {
        console.error(error);
    }   
});



(async () => {
    // Start your app
    const port = process.env.PORT || 3000;
    await app.start(port);
    console.log(`⚡️ Bolt app is running on port ${port}!`);
})();
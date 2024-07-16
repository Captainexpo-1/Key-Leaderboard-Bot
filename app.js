const { App } = require('@slack/bolt');
const AirTable = require('airtable');



// Load ENV
require('dotenv').config();

const app = new App({
    token: process.env.SLACK_AUTH_SECRET,
    signingSecret: process.env.SLACK_SIGNING_SECRET
});

const airtable = new AirTable({
    apiKey: process.env.AIRTABLE_API_KEY
});


async function notifyUser( userID, message){
    try{
        await app.client.conversations.open({
            token: process.env.SLACK_AUTH_SECRET,
            users: userID
        });
        await app.client.chat.postMessage({
            token: process.env.SLACK_AUTH_SECRET,
            channel: userID,
            text: message
        });
    }
    catch( err ){
        console.log(err);
    }
}


const ticketsMessage = (tickets) => {
    const choices = [
        `The ferryman has come for you bringing ${tickets} tickets.`,
    ]
    return choices[Math.floor(Math.random() * choices.length)];
}

async function updateUserTickets( userID, tickets ){
    const base = airtable.base(process.env.AIRTABLE_BASE_ID);
    const table = base.table('Users');

    notifyUser(userID, ticketsMessage(tickets));
    table.select({
        filterByFormula: `{Slack ID} = '${userID}'`
    }).eachPage(function page(records, fetchNextPage) {
        records.forEach(function(record) {
            let currentTickets = record.get('Tickets');
            let newTickets = currentTickets + tickets;
            console.log('Current Tickets:', currentTickets);
        });
        fetchNextPage();
    }, function done(err) {
        if (err) { console.error(err); return; }
    });
}

async function userIsAdmin(uid){
    const userInfo = await app.client.users.info({ user: uid });
    const user = userInfo.user;
    return user.is_admin;
}

async function respondToCommand(user,channel,text, isEphemeral = true){
    try{
        if (isEphemeral) {
            await app.client.chat.postEphemeral({
                token: process.env.SLACK_AUTH_SECRET,
                channel: channel,
                text: text,
                user: user,
            });
            return;
        }
        await app.client.chat.postMessage({
            token: process.env.SLACK_AUTH_SECRET,
            channel: channel,
            text: text,
        });
    }
    catch( err ){
        console.log(err);
        respondToCommand(user, channel, 'The ferryman looks at you with a confused look. Something went wrong.', true);

    }

}

app.command('/ticket-ferry', async ({ command, ack, say }) => {
    // Acknowledge the command request
    await ack();


    let userCanRunCommand = false;
    try{
        userCanRunCommand = await userIsAdmin(command.user_id);
    }
    catch( err ){
        console.log(err);
        respondToCommand(command.user_id, command.channel_id, 'The ferryman looks at you with a confused look. You are not allowed to run this command.', true);
        return;
    }
    let override = false;
    if( !userCanRunCommand && !override){
        respondToCommand(command.user_id, command.channel_id, 'The ferryman looks at you with a confused look. You are not allowed to run this command.', true);
        return;
    }
    let user;
    let user_name;
    let requested_user;
    let requested_uid;
    let requested_username
    let numberOfTickets;
    let args;

    try{
        user = command.user_id;
        user_name = command.user_name;
        args = command.text.split(' ');
        requested_user = args[0].replace('<@', '').replace('>', '').split('|');
        requested_uid = requested_user[0];
        requested_username = requested_user[1];
        numberOfTickets = args[1];    
    }
    catch( err ){
        respondToCommand(command.user_id, command.channel_id, 'Please provide a username and number of tickets', true);
        return;
    }
    if (!requested_username || !numberOfTickets) {
        respondToCommand(command.user_id, command.channel_id, 'Please provide a username and number of tickets', true);
        return;
    }
    try{
        numberOfTickets = parseFloat(numberOfTickets);
    }
    catch( err ){
        respondToCommand(command.user_id, command.channel_id, 'Please provide a valid number of tickets', true);
        return;
    }

    console.log('User:', user);
    console.log('User Name:', user_name);
    console.log('Requested User:', requested_user);
    console.log('Number of Tickets:', numberOfTickets);
    console.log("Is Admin:", userCanRunCommand);
    console.log(command.text.trim());

    try{
        respondToCommand(command.user_id, command.channel_id, `Request sent to ferry captain! He is running to ${requested_username} to give then ${numberOfTickets} tickets!`, true);
    } catch( err ){
        console.log(err);
        respondToCommand(command.user_id, command.channel_id, 'The ferryman looks at you with a confused look. Something went wrong.', true);
    }
    try{
        updateUserTickets(requested_uid, numberOfTickets);
    }
    catch( err ){
        console.log(err);
        respondToCommand(command.user_id, command.channel_id, 'The ferryman looks at you with a confused look. Something went wrong.', true);
    }
});


(async () => {
    // Start your app
    const port = process.env.PORT || 3000;
    await app.start(port);
    console.log(`The ferry is running on river ${port}!`);
})();
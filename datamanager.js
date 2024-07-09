const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'data', 'records');
const backupPath = path.join(__dirname, 'data', 'backups');
function addRecord(name, data) {
    try {
        fs.writeFileSync(path.join(dataPath, `${name}.json`), JSON.stringify(data));
    } catch (err) {
        console.error(err);
    }
}
function recordExists(name) {
    try {
        return fs.existsSync(path.join(dataPath, `${name}.json`));
    } catch (err) {
        console.error(err);
        return false;
    }
}
function getRecord(name) {
    try {
        const fileContent = fs.readFileSync(path.join(dataPath, `${name}.json`), 'utf8');
        return JSON.parse(fileContent);
    } catch (err) {
        console.error(err);
        return { "error": err };
    }
}
function updateRecord(name, data) {
    try {
        if (fs.existsSync(path.join(dataPath, `${name}.json`))) {
            fs.writeFileSync(path.join(dataPath, `${name}.json`), JSON.stringify(data));
            return 0;
        } else {
            console.error("File not found");
            return 1;
        }
    } catch (err) {
        console.error(err);
        return 1;
    }
}

function deleteRecord(name) {
    try {
        fs.unlinkSync(path.join(dataPath, `${name}.json`));
    }
    catch (err) {
        console.error(err);
    }
}
function backupAllRecords(){
    try {
        const files = fs.readdirSync(dataPath);
        for (let file of files){
            console.log("File: ", file, files);
            const t = fs.readFileSync(path.join(dataPath, file), 'utf8');
            fs.writeFileSync(path.join(backupPath, file), t);
        }
    } catch (err) {
        console.error(err);
    }

}
function getAllRecords(){
    try {
        const files = fs.readdirSync(dataPath);
        let records = [];
        for (let file of files){
            const readFile = fs.readFileSync(path.join(dataPath, file), 'utf8');
            records.push(JSON.parse(readFile));
        }
        console.log("Records: ", records)
        return records;
    } catch (err) {
        console.error(err);
        return []
    }
}

function deleteAllRecords(forcenobackup=false){
    try {
        if (!forcenobackup){
            backupAllRecords();
        }
        const files = fs.readdirSync(dataPath);
        for (let file of files){
            fs.unlinkSync(path.join(dataPath, file));
        }
    }
    catch (err) {
        console.error(err);
    }
}

module.exports = {
    addRecord,
    getRecord,
    updateRecord,
    recordExists,
    deleteRecord,
    backupAllRecords,
    getAllRecords,
    deleteAllRecords
};


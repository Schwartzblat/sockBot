const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const {s} = require('@adiwajshing/baileys');
/**
 *
 * @param {string} filename
 * @param {string} data
 * @returns {void}
 */
const appendToFile = async (filename, data)=>{
    await fs.appendFileSync(filename, data+"\n");
}
/**
 *
 * @param {string} phone
 * @return {Promise<unknown>}
 */
const isInBlackList = async (phone)=>{
    const db = new sqlite3.Database(path.resolve(__dirname, '..\\..\\blacklist.db'));
    const command = "select * from blacklist where phone="+phone;
    return new Promise((resolve, reject) => {
        db.all( command, (err, rows) => {
            if (err) {
                resolve(false);
            } else {
                if (rows.length >0){
                    const currentTime = Math.floor(new Date().getTime() / 1000);
                    if(rows[0]["end"]!==-1 && rows[0]["end"]<currentTime){
                        console.log(phone+" deleted from blacklist");
                        db.run("delete from blacklist where phone="+phone);
                        resolve(false);
                        return;
                    }
                }
                resolve(rows.length>0);
            }
        })
    })
}
/**
 *
 * @param {string} str
 * @returns {string}
 */
const reverse = (str)=>{
    str = str.toString();
    let newStr='';
    for (let i=str.length-1;i>-1;i--){
        newStr = newStr+str[i];
    }
    return newStr;
}
/**
 *
 * @param {number} num
 * @returns {string}
 */
const pad = (num)=>{
    return num<10 ? '0'+num.toLocaleString(): num.toString();
}

/**
 * @param {string} participant
 * @param {GroupMetadata} chat
 * @return {false|boolean|*}
 */
const isGroupAdmin = (participant, chat) => {
    return chat.participants.find(par=>par.id.split("@")[0]===participant).admin !== null;
};

/**
 * Redirects command calls to the right handler.
 *
 * @param {proto.IWebMessageInfo} message
 * @param {makeWASocket} sock
 * @return {Promise<void>}
 */
const procJoin = async (message, sock) => {
    const user = message.messageStubParameters[0];
    if(message.messageStubType === 27 || user.startsWith("972") && !(await isInBlackList(user.split("@")[0]))){
        return;
    }
    const chat = await sock.groupMetadata(message.key.remoteJid);
    if(isGroupAdmin(sock.user.id.split(":")[0], chat)){
        return;
    }
    await sock.groupParticipantsUpdate(message.key.remoteJid, [user], "remove");
    const date = new Date();
    const dateFormatted = pad(date.getHours())+":"+pad(date.getMinutes())+":"+pad(date.getSeconds())+","+pad(date.getDate())+"."+pad(date.getMonth()+1)+"."+date.getFullYear();
    console.log("kicked: "+user.split("@")[0]+" from: "+reverse(chat.subject)+" at "+ dateFormatted);
    const data = user.split("@")[0]+","+chat.subject+","+dateFormatted;
    await appendToFile(path.resolve(__dirname, "../../kickedData.txt"), data);
}
module.exports = procJoin;

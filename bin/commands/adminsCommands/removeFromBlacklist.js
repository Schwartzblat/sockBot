const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const {removeFirstWord, parsePhone} = require('../../utils/stringUtils');
const {getContentType} = require("@adiwajshing/baileys");
const privilegedUsers = require('../../../config/admins.json').privilegedUsers;

const isAdmin = (message) => {
    return message.fromMe || privilegedUsers.includes(message.key.participant || message.key.remoteJid);
};
/**
 * add phone to blacklist.
 *
 * @param {proto.IWebMessageInfo} message
 * @param {makeWASocket} sock
 * @return {Promise<void>}
 */
const procCommand = async (message, sock) => {
    if(!isAdmin(message)){
        return;
    }
    let sql;
    if(getContentType(message) === "extendedTextMessage" && message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length>0){
        const phone = message.message.extendedTextMessage.contextInfo.mentionedJid[0].split("@")[0];
        sql = "delete from blacklist where phone="+phone;
    }else{
        const phone = parsePhone(removeFirstWord(message.body));
        sql = "delete from blacklist where phone="+parsePhone(phone);
    }

    if(!sql){
        return;
    }

    const db = new sqlite3.Database(path.resolve(__dirname, '../../../blacklist.db'));
    try {
        db.run(sql);
        await sock.sendMessage(message.key.remoteJid, {text: "בוצע"}, {quoted: message});
    }catch(err){
        await sock.sendMessage(message.key.remoteJid, {text: "לא עבד"}, {quoted: message});
    }
};

module.exports = procCommand;

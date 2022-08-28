const Jimp = require('jimp');
const {Sticker} = require('wa-sticker-formatter');
const path = require('path');
const defaultImagePath = path.resolve(__dirname, '../../../public/defaultProfilePic.png');
const {proto} = require('@adiwajshing/baileys');
const {removeFirstWord} = require('../../utils/stringUtils');
const {getRandomIntInclusive} = require('../../utils/random');
const privilegedUsers = require('../../../config/admins.json').privilegedUsers;

const isAdmin = (message) => {
    return message.key.fromMe || privilegedUsers.includes(message.key.participant || message.key.remoteJid);
};

/**
 * Returns a random number between 0 and 100, uses names as seed.
 *
 * @param {string} phone1
 * @param {string} phone2
 * @return {number}
 */
const getLovePercentage = (phone1, phone2) => {
    const namesArray = [phone1, phone2].sort();
    return getRandomIntInclusive(0, 100, {seed: namesArray[1] + namesArray[0]});
};

/**
 * Processes love calculator command.
 *
 * @param {proto.IWebMessageInfo} message
 * @param {makeWASocket} sock
 * @param {makeInMemoryStore} store
 * @return {Promise<void>}
 */
const procCommand = async (message, sock) => {
    if (!isAdmin(message) || !message.key.remoteJid.endsWith("g.us")){
        return;
    }
    const chat = await sock.groupMetadata(message.key.remoteJid);
    let someone = message.key.participant;
    if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid){
        someone = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
    }
    let matches = [];
    for (const participant of chat.participants){
        const obj = {
            phone: participant.id.split("@")[0],
            percent: getLovePercentage(participant.id.split("@")[0], someone.split("@")[0])
        };
        matches.push(obj);
    }
    matches.sort((a, b)=>{
        return b.percent-a.percent;
    });
    let output = '*ההתאמות שלך עם שאר חברי הקבוצה:*\n';
    for(let i =0;i<matches.length;i++){
        output+=(i+1)+". "+matches[i].phone+"- "+matches[i].percent+"%\n";
    }
    await sock.sendMessage(message.key.participant, {text: output})
};

module.exports = procCommand;

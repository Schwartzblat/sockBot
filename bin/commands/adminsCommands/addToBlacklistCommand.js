const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const {parsePhone, removeFirstWord} = require('../../utils/stringUtils');
const {getContentType} = require('@adiwajshing/baileys');
const {isPrivileged} = require('../../utils/permissionsUtils');


/**
 * add phone to blacklist.
 *
 * @param {proto.IWebMessageInfo} message
 * @param {makeWASocket} sock
 * @return {Promise<void>}
 */
const procCommand = async (message, sock) => {
  if (!isPrivileged(message)) {
    return;
  }
  let phone; let name;
  if (getContentType(message.message) === 'extendedTextMessage' && message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length>0) {
    phone = message.message.extendedTextMessage.contextInfo.mentionedJid[0].split('@')[0];
    name = phone;
  } else {
    phone = parsePhone(removeFirstWord(message.body));
    name = phone;
  }
  let timeToBlock = parseInt(message.body.split(' ')[message.body.split(' ').length-1]);
  const currentTime = Math.floor(new Date().getTime() / 1000);
  if (isNaN(timeToBlock) || timeToBlock===-1) {
    timeToBlock = -1 - currentTime;
  }
  const db = new sqlite3.Database(path.resolve(__dirname, '../../../blacklist.db'));
  try {
    const sql = 'insert into blacklist (name, phone, start, end) values (\'' + name + '\', \'' + phone + '\', ' + currentTime + ', ' + (currentTime + timeToBlock) + ');';
    db.run(sql);
    await sock.sendMessage(message.key.remoteJid, {text: 'בוצע'}, {quoted: message});
  } catch (err) {
    console.log(err);
    await sock.sendMessage(message.key.remoteJid, {text: 'בעיה בדאטהבייס'}, {quoted: message});
  }
};

module.exports = procCommand;

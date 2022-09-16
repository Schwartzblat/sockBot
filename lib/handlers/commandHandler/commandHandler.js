const {getContentType} = require('@adiwajshing/baileys');
const procTextCommand = require('./textCommandHandler');
const procMediaCommand = require('./mediaCommandHandler');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
/**
 * @param {proto.IWebMessageInfo} message
 * @return {Promise<unknown>}
 */
const isInBlackList = async (message)=>{
  const db = new sqlite3.Database(path.resolve(__dirname, '..\\..\\..\\blacklist.db'));
  const phone = (message.key.participant || message.key.remoteJid).split('@')[0] || message.key.remoteJid.split('@')[0];
  const command = 'select * from blacklist where phone='+phone;
  return new Promise((resolve, reject) => {
    db.all( command, (err, rows) => {
      if (err) {
        resolve(false);
      } else {
        if (rows.length >0) {
          const currentTime = Math.floor(new Date().getTime() / 1000);
          if (rows[0]['end']!==-1 && rows[0]['end']<currentTime) {
            console.log(phone+' deleted from blacklist');
            db.run('delete from blacklist where phone='+phone);
            resolve(false);
            return;
          }
        }
        resolve(rows.length>0);
      }
    });
  });
};
/**
 *
 * @param {proto.IWebMessageInfo} message
 * @return {boolean}
 */
const isCommand = (message)=> {
  switch (getContentType(message.message)) {
    case 'conversation':
      return message.body.startsWith('!');
    case 'extendedTextMessage':
      return message.body.startsWith('!');
    case 'imageMessage':
      return message.message.imageMessage.caption.startsWith('!');
    case 'videoMessage':
      return message.message.videoMessage.caption.startsWith('!');
    default:
      return false;
  }
};

/**
 * Redirects command calls to the right handler.
 *
 * @param {proto.IWebMessageInfo} message
 * @param {makeWASocket} sock
 * @param {makeInMemoryStore} store
 * @param {WAMiniGame.MiniGames} miniGames
 * @return {Promise<void>}
 */
const procMessage = async (message, sock, store, miniGames) => {
  if (!isCommand(message) || await isInBlackList(message) || message.key.fromMe) {
    return;
  }
  if (getContentType(message.message) === 'conversation' || getContentType(message.message) === 'extendedTextMessage') {
    await procTextCommand(message, sock, store, miniGames);
  } else {
    await procMediaCommand(message, sock);
  }
};
module.exports = procMessage;

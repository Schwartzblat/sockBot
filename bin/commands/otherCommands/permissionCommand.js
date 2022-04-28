const privilegedUsers = require('../../../config/admins.json').privilegedUsers;
/**
 *
 * @param {proto.IWebMessageInfo} message
 * @param {GroupMetadata} chat
 * @return {false|boolean|*}
 */
const isGroupAdmin = (message, chat) => {
  return chat.participants.find(par=>par.id===message.key.participant).admin !==null;
};

/**
 * Checks if someone is allowed to use command.
 *
 * @param {proto.IWebMessageInfo} message
 * @return {boolean}
 */
const isPrivileged = (message) => {
  return message.key.fromMe || privilegedUsers.includes(message.key.participant);
};

/**
 * Process tagAll command.
 *
 * @param {proto.IWebMessageInfo} message
 * @param {makeWASocket} sock
 * @return {Promise<void>}
 */
const procCommand = async (message, sock) => {
  if(isPrivileged(message)){
    await sock.sendMessage(message.key.remoteJid, {text: "אתה אדמין של הבוט"}, {quoted: message});
    return;
  }else if(message.key.remoteJid.endsWith("g.us") && await isGroupAdmin(message, await sock.groupMetadata(message.key.remoteJid))){
    await sock.sendMessage(message.key.remoteJid, {text: "אתה מנהל קבוצה"}, {quoted: message});
    return;
  }else{
    await sock.sendMessage(message.key.remoteJid, {text: "אתה משתמש רגיל"}, {quoted: message});
    return;
  }
};

module.exports = procCommand;

const {isPrivileged, isGroupAdmin} = require('../../utils/permissionsUtils');


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

const {privilegedUsers} = require("../../../config/admins.json");

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
 *
 * @param {proto.IWebMessageInfo} message
 * @returns {*}
 */
const isAdmin = (message) => {
  return message.key.fromMe || privilegedUsers.includes(message.key.participant || message.key.remoteJid);
};
/**
 *
 * @param {proto.IWebMessageInfo} message
 * @param {makeWASocket} sock
 * @return {Promise<void>}
 */
const procCommand = async (message, sock) =>{
  const contextInfo = message.message?.extendedTextMessage?.contextInfo;
  const quoted = contextInfo?.quotedMessage;
  if(!quoted ){
    return;
  }
  if(contextInfo.participant.split("@")[0] !== sock.user.id.split(":")[0]){
    if (!message.key.remoteJid.endsWith("@g.us")){
      return;
    }
    const chat = await sock.groupMetadata(message.key.remoteJid);
    if(!isGroupAdmin(message, chat) && !isAdmin(message)){
      return;
    }
  }
  const key = {
    remoteJid: message.key.remoteJid,
    fromMe: contextInfo.participant.split("@")[0] === sock.user.id.split(":")[0],
    id: contextInfo.stanzaId,
    participant: contextInfo.participant,
  }
  await sock.sendMessage(message.key.remoteJid, {delete: key});
}
module.exports = procCommand;

const {getContentType} = require("@adiwajshing/baileys");
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
  const isGroup = message.key.remoteJid.endsWith("@g.us");
  if(!isGroup || !(isPrivileged(message) || isGroupAdmin(message, await sock.groupMetadata(message.key.remoteJid)))) {
    return;
  }
  const chat =  await sock.groupMetadata(message.key.remoteJid);
  let output = "";
  let mentions = [];
  for (const participant of chat.participants) {
    mentions.push(participant.id);
    output += `@${participant.id.split("@")[0]} `;
  }
  if (getContentType(message.message)==="extendedTextMessage" && message.message.extendedTextMessage.contextInfo.quotedMessage){
    const contextInfo = message.message.extendedTextMessage.contextInfo;
    const msg = {
      key: {
        remoteJid: /*message.key.remoteJid*/ contextInfo.remoteJid,
        id: contextInfo.stanzaId,
        participant: contextInfo.participant
      },
      message: contextInfo.quotedMessage
    }
    await sock.sendMessage(message.key.remoteJid, {text: output, mentions: mentions}, {quoted: msg});
    return;
  }
  await sock.sendMessage(message.key.remoteJid, {text: output, mentions: mentions});
};

module.exports = procCommand;

const {removeFirstWord, parsePhone} = require('../../utils/stringUtils');
const privilegedUsers = require('../../../config/admins.json').privilegedUsers;


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
 * @param {string} participant
 * @param {GroupMetadata} chat
 * @return {false|boolean|*}
 */
const isGroupAdmin = (participant, chat) => {
  return chat.participants.find(par=>par.id===participant).admin !==null;
};

/**
 * add phone to blacklist.
 *
 * @param {proto.IWebMessageInfo} message
 * @param {makeWASocket} sock
 * @return {Promise<void>}
 */
const procCommand = async (message, sock) => {
  const chat =  await sock.groupMetadata(message.key.remoteJid);
  const isGroup = message.key.remoteJid.endsWith("@g.us");
  if (!isGroup || !(isGroupAdmin(message.key.participant, chat) || isPrivileged(message))){
    return;
  }
  const mentions = message.message.extendedTextMessage.contextInfo.mentionedJid;
  let phone;
  if (mentions.length>0) {
    phone = mentions[0].split("@")[0];
  }else{
    phone = parsePhone(removeFirstWord(message.body));
  }

  if(isGroupAdmin(sock.user.id.split(":")[0]+"@s.whatsapp.net", chat)){
    try {
      await sock.groupParticipantsUpdate(message.key.remoteJid, [phone+"@s.whatsapp.net"], "remove");
      await sock.sendMessage(message.key.remoteJid, {text: "בוצע"}, {quoted: message});
    }catch(err){}
  }
};

module.exports = procCommand;

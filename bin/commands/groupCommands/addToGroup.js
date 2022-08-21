const {removeFirstWord, parsePhone} = require('../../utils/stringUtils');
const privilegedUsers = require('../../../config/admins.json').privilegedUsers;

/**
 * Checks if someone is allowed to use command.
 *
 * @param {proto.IWebMessageInfo} message
 * @return {boolean}
 */
const isPrivileged = (message) => {
  return message.key.fromMe ||
      privilegedUsers.includes(message.key.participant);
};

/**
 * @param {string} participant
 * @param {GroupMetadata} chat
 * @return {false|boolean|*}
 */
const isGroupAdmin = (participant, chat) => {
  return chat.participants.find((par) => par.id === participant).admin !== null;
};
/**
 * @param {proto.IWebMessageInfo} message
 * @param {makeWASocket} sock
 * @return {Promise<void>}
 */
const procCommand = async (message, sock) => {
  if (!message.key.remoteJid.endsWith('@g.us')) {
    return;
  }
  const chat = await sock.groupMetadata(message.key.remoteJid);
  if (!isGroupAdmin(sock.user.id.split(':')[0] + '@s.whatsapp.net', chat) ||
      (!isPrivileged(message) &&
          !isGroupAdmin(message.key.participant, chat))) {
    return;
  }

  const phone = parsePhone(removeFirstWord(message.body));
  await sock.groupParticipantsUpdate(message.key.remoteJid,
      [phone + '@s.whatsapp.net'], 'add');
  await sock.sendMessage(message.key.remoteJid, {text: 'בוצע'},
      {quoted: message});
};

module.exports = procCommand;

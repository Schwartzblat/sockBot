const privilegedUsers = require('../../../config/admins.json').privilegedUsers;
const fs = require('fs');
const path = require('path');

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
 *
 * @param {WAWebJS.Message} message
 * @param {makeWASocket} sock
 * @return {Promise<void>}
 */
const procCommand = async (message, sock) => {
  const chat = await sock.groupMetadata(message.key.remoteJid);
  if (!isPrivileged(message) && !isGroupAdmin(message.key.participant, chat)) {
    return;
  }
  const configPath = path.resolve(__dirname, '../../../config/safeGroups.json');
  const safeGroups = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  safeGroups.push(chat.id);
  await fs.writeFileSync(configPath, JSON.stringify(safeGroups));
  await sock.sendMessage(message.key.remoteJid, {text: 'בוצע'},
      {quoted: message});
};

module.exports = procCommand;

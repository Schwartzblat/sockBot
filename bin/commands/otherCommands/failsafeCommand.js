const privilegedUsers = require('../../../config/admins.json').privilegedUsers;

const isAdmin = (message) => {
  return message.key.fromMe || privilegedUsers.includes(message.key.participant || message.key.remoteJid);
};

/**
 * A simple failsafe command.
 * @param {proto.IWebMessageInfo} message
 * @return {Promise<void>}
 */
const procCommand = async (message) => {
  if (isAdmin(message)) {
    process.exit(-1);
  }
};

module.exports = procCommand;

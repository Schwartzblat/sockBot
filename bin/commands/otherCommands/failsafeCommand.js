const {isPrivileged} = require('../../utils/permissionsUtils');


/**
 * A simple failsafe command.
 * @param {proto.IWebMessageInfo} message
 * @return {Promise<void>}
 */
const procCommand = async (message) => {
  if (isPrivileged(message)) {
    process.exit(-1);
  }
};

module.exports = procCommand;

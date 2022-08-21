const stickerCommand = require(
    '../../../bin/commands/stickerCreatorCommands/stickerMediaCommand');
const {surveyCommand} = require(
    '../../../bin/commands/otherCommands/surveyCommand');
/**
 * Redirects command calls to the right command file.
 *
 * @param {proto.IWebMessageInfo} message
 * @param {makeWASocket} socket
 * @return {Promise<void>}
 */
const procCommand = async (message, socket) => {
  const messageParts = message.body.split(' ');
  switch (messageParts[0].substr(1)) {
    case 'סטיקר':
      await stickerCommand(message, socket);
      break;
    case 'סקר':
      await surveyCommand(message, socket);
      break;
  }
};

module.exports = procCommand;

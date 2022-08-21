const {removeFirstWord} = require('../../utils/stringUtils');

/**
 * Process format command.
 *
 * @param  {proto.IWebMessageInfo} message
 * @param {makeWASocket} sock
 * @return {Promise<void>}
 */
const procCommand = async (message, sock) => {
  const name = removeFirstWord(message.body);
  const quoted = message?.message?.extendedTextMessage?.contextInfo.
      quotedMessage;
  if (!quoted || !quoted.conversation || quoted.conversation.startsWith('!')) {
    return;
  }
  const format = quoted.conversation;

  let output = '';
  const num = parseInt(format.split('\n')[format.split('\n').length - 1]);
  if (!isNaN(num)) {
    output += format + '\n' + (num + 1).toLocaleString() + '. ' + name;
  } else {
    output = format + '\n' + name;
  }
  await sock.sendMessage(message.key.remoteJid, {text: output},
      {quoted: message});
};

module.exports = procCommand;

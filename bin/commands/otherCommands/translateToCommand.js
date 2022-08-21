const {removeFirstWord} = require('../../utils/stringUtils');
const translateStringTo = require('../../utils/translator').translateStringTo;

/**
 * Process translateTo command.
 *
 * @param {proto.IWebMessageInfo} message
 * @param {makeWASocket} sock
 * @return {Promise<void>}
 */
const procCommand = async (message, sock) => {
  let text = removeFirstWord(message.body);
  if (!text || text.length < 2) {
    const quotedMessage =
        message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (quotedMessage) {
      text = quotedMessage.conversation || quotedMessage.text;
    } else {
      return;
    }
  }
  const translatedText = await translateStringTo(text, 'he');
  let output = 'הטקסט תורגם בהצלחה:' + '\n';
  output += translatedText;
  await sock.sendMessage(message.key.remoteJid, {text: output},
      {quoted: message});
};

module.exports = procCommand;

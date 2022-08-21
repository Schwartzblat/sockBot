/**
 * Processes the device command.
 *
 * @param {proto.IWebMessageInfo} message
 * @param {makeWASocket} sock
 * @return {Promise<void>}
 */
const procCommand = async (message, sock) => {
  let deviceType;
  if (message?.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
    deviceType =
        message.message.extendedTextMessage.contextInfo.stanzaId.length > 21 ?
            'Android' :
            message.message.extendedTextMessage.contextInfo.stanzaId.substring(
                0,
                2) === '3A' ? 'IOS' : 'WhatsApp Web';
  } else {
    deviceType = message.key.id.length > 21 ?
        'Android' :
        message.key.id.substring(0, 2) === '3A' ? 'IOS' : 'WhatsApp Web';
  }

  await sock.sendMessage(message.key.remoteJid, {text: deviceType},
      {quoted: message});
};

module.exports = procCommand;

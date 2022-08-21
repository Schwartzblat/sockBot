/**
 *
 * @param {proto.IWebMessageInfo} message
 * @param {makeWASocket} sock
 * @return {Promise<void>}
 */

const procCommand = async (message, sock) => {
  const contextInfo = message.message?.extendedTextMessage?.contextInfo;
  const quoted = contextInfo?.quotedMessage;
  if (!quoted) {
    return;
  }
  if (contextInfo.participant.split('@')[0] === sock.user.id.split(':')[0]) {
    const key = {
      remoteJid: message.key.remoteJid,
      fromMe: true,
      id: contextInfo.stanzaId,
    };
    await sock.sendMessage(message.key.remoteJid, {delete: key});
  }
};

module.exports = procCommand;

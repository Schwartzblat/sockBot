const {removeFirstWord} = require('../../utils/stringUtils');
const {generateWAMessageFromContent, proto, generateMessageID} = require(
    '@adiwajshing/baileys');
const base = 'https://googlethatforyou.com';
/**
 * @param {proto.IWebMessageInfo} message
 * @param {makeWASocket} sock
 * @return {Promise<void>}
 */
const procCommand = async (message, sock) => {
  const text = removeFirstWord(message.body);
  if (!text || text.length === 0) {
    return;
  }
  const output = base + '?q=' + encodeURIComponent(text);
  // eslint-disable-next-line no-unused-vars
  const template = generateWAMessageFromContent(generateMessageID(),
      proto.Message.fromObject({
        extendedTextMessage: {
          text: output,
          matchedText: output,
          canonicalUrl: base,
          previewType: 0,
          title: 'Here, Let Me Google That For You',
          // eslint-disable-next-line max-len
          description: 'Passive-aggressively teach your friends how to Google. For all those people who find it more convenient to ask you rather than search it themselves. Not associated with Google.',
        },
      }), {quoted: message});
  // eslint-disable-next-line max-len
  // await sock.relayMessage(message.key.remoteJid, template.message, template.key.id);
  await sock.sendMessage(message.key.remoteJid, {text: output},
      {quoted: message});
};

module.exports = procCommand;

const {removeFirstWord, parsePhone} = require('../../utils/stringUtils');
const {isPrivileged} = require('../../utils/permissionsUtils');


/**
 *
 * @param {proto.IWebMessageInfo} message
 * @param {makeWASocket} sock
 * @return {Promise<void>}
 */
const procCommand = async (message, sock) => {
  const isGroup = message.key.remoteJid.endsWith('@g.us');
  if (!isGroup || !(isPrivileged(message))) {
    return;
  }
  const phone = message?.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length>0? message.message.extendedTextMessage.contextInfo.mentionedJid[0].split(':')[0].split('@')[0]: parsePhone(removeFirstWord(message.body));
  await sock.groupParticipantsUpdate(message.key.remoteJid, [phone+'@s.whatsapp.net'], 'promote');
  await sock.sendMessage(message.key.remoteJid, {text: 'בוצע'}, {quoted: message});
};

module.exports = procCommand;

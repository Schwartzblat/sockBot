const {removeFirstWord, parsePhone} = require('../../utils/stringUtils');
const {isPrivileged} = require('../../utils/permissionsUtils');


/**
 * Process tagAll command.
 *
 * @param {proto.IWebMessageInfo} message
 * @param {makeWASocket} sock
 * @param {makeInMemoryStore} store
 * @return {Promise<void>}
 */
const procCommand = async (message, sock, store) => {
  const isGroup = message.key.remoteJid.endsWith('@g.us');
  if (!isGroup || !(isPrivileged(message))) {
    return;
  }
  const phone = message?.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length>0? message.message.extendedTextMessage.contextInfo.mentionedJid[0].split(':')[0].split('@')[0]: parsePhone(removeFirstWord(message.body));
  try {
    await sock.groupParticipantsUpdate(message.key.remoteJid, [phone+'@s.whatsapp.net'], 'remove');
  } catch (err) {}
  const messages = store.messages[message.key.remoteJid].array.reverse();
  let counter = 0;
  for (const message of messages) {
    if (message.key.participant === phone+'@s.whatsapp.net') {
      await sock.sendMessage(message.key.remoteJid, {delete: message.key});
      counter++;
    }
  }
  await sock.sendMessage(message.key.remoteJid, {text: 'נמחקו '+counter+' הודעות'}, {quoted: message});
};

module.exports = procCommand;

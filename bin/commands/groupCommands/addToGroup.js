const {removeFirstWord, parsePhone} = require('../../utils/stringUtils');
const {isPrivileged, isGroupAdminId, gammaGroupId, isGammaAdmin} = require('../../utils/permissionsUtils');


/**
 * @param {proto.IWebMessageInfo} message
 * @param {makeWASocket} sock
 * @return {Promise<void>}
 */
const procCommand = async (message, sock) => {
  if(!message.key.remoteJid.endsWith('@g.us')){
    return;
  }
  const chat =  await sock.groupMetadata(message.key.remoteJid);
  if(!isGroupAdminId(sock.user.id.split(":")[0]+"@s.whatsapp.net", chat) || (!isPrivileged(message) && !(isGroupAdminId(message.key.participant, chat) || (message.key.remoteJid===gammaGroupId && isGammaAdmin(message))))){
    return;
  }

  const phone = parsePhone(removeFirstWord(message.body));
  await sock.groupParticipantsUpdate(message.key.remoteJid, [phone+"@s.whatsapp.net"], "add");
  await sock.sendMessage(message.key.remoteJid, {text: "בוצע"}, {quoted: message});
};

module.exports = procCommand;

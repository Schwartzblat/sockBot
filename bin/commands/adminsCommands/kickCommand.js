const {removeFirstWord, parsePhone} = require('../../utils/stringUtils');
const {isPrivilegedId, isGroupAdmin, isGroupAdminId, gammaGroupId, isGammaAdmin} = require('../../utils/permissionsUtils');



/**
 *
 * @param {string} phone
 * @param {GroupMetadata} groupMetadata
 */
const findCommonGroups = async(phone, groupMetadata)=>{
  const commonGroups = [];
  for(const [id, groupInfo] of Object.entries(groupMetadata)) {
    if (groupInfo.participants.find(par => par.id.split("@")[0]===phone)) {
      commonGroups.push(id);
    }
  }
  return commonGroups;
}
/**
 * add phone to blacklist.
 *
 * @param {proto.IWebMessageInfo} message
 * @param {makeWASocket} sock
 * @param {makeInMemoryStore} store
 * @return {Promise<void>}
 */
const procCommand = async (message, sock, store) => {
  const chat =  await sock.groupMetadata(message.key.remoteJid);
  const isGroup = message.key.remoteJid.endsWith("@g.us");
  if (!isGroup){
    return;
  }
  const mentions = message.message?.extendedTextMessage?.contextInfo?.mentionedJid;
  let phone;
  if (mentions && mentions.length>0) {
    phone = mentions[0].split("@")[0];
  }else{
    if(removeFirstWord(message.body).split(" ")[0] === "הכל"){
      phone = parsePhone(message.body.split("הכל ")[1]);
    }else {
      phone = parsePhone(removeFirstWord(message.body));
    }
  }
  if(isPrivilegedId(phone)){
    await sock.sendMessage(message.key.remoteJid, {text: "אתה לא יכול להסיר אדמין"}, {quoted: message});
    return;
  }
  if(removeFirstWord(message.body).split(" ")[0] === "הכל" && isPrivileged(message)){
    const groupMetadata = await sock.groupFetchAllParticipating();
    const jids = await findCommonGroups(phone, groupMetadata);
    let errorCounter = 0;
    for (const jid of jids){
      try {
        if (!isGroupAdmin(sock.user.id.split(":")[0]+"@s.whatsapp.net", groupMetadata[jid])){
          errorCounter++;
          continue;
        }
        await sock.groupParticipantsUpdate(jid, [phone + "@s.whatsapp.net"], "remove");
      }catch(e){
        errorCounter++;
      }
    }
    await sock.sendMessage(message.key.remoteJid, {text:"המספר "+phone+" הוסר בהצלחה ב"+(jids.length-errorCounter)+"/"+jids.length+" קבוצות"}, {quoted: message});
    return;
  }
  if((isGroupAdmin(message, chat) || (message.key.remoteJid===gammaGroupId && isGammaAdmin(message))) && isGroupAdminId(sock.user.id.split(":")[0]+"@s.whatsapp.net", chat)){
    try {
      await sock.groupParticipantsUpdate(message.key.remoteJid, [phone+"@s.whatsapp.net"], "remove");
      await sock.sendMessage(message.key.remoteJid, {text: "בוצע"}, {quoted: message});
    }catch(err){}
  }
};

module.exports = procCommand;

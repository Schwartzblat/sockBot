const {privilegedUsers} = require('../../../config/admins.json');
const isAdmin = (message) => {
  return message.fromMe || privilegedUsers.includes(message.key.participant || message.key.remoteJid);
};
/**
 * @param {string} text
 */
const textToInviteV4 = (text)=>{
  let obj = {
    fromId: text.split("\n")[1].split("מ: ")[1].trim()+"@c.us",
    toId: undefined,
  };
  for(let line of text.split("\n")){
    if(line.search("inviteCodeExp")>=0){
      obj.inviteCodeExp = parseInt(line.split(": ")[1].trim());
    }else if(line.search("inviteCode")>=0){
      obj.inviteCode = line.split("'")[1].trim();
    }else if(line.search("groupId")>=0){
      obj.groupId = line.split("'")[1].trim();
    }
  }
  return obj;
}
const groupLinkPattern = new RegExp("http[s]?://chat\.whatsapp\.com/[a-zA-Z0-9]{5,30}");
/**
 *
 * @param {string} text
 */
const textToGroupLink = (text)=>{
  return text.match(groupLinkPattern).toString();
}
/**
 * add phone to blacklist.
 *
 * @param {proto.IWebMessageInfo} message
 * @param {makeWASocket} sock
 * @return {Promise<void>}
 */
const procCommand = async (message, sock) => {
  if(!isAdmin(message) || !message?.message?.extendedTextMessage?.contextInfo?.quotedMessage){
    return;
  }
  const quoted = message.message.extendedTextMessage.contextInfo.quotedMessage.conversation;
  if(quoted.split("סוג: ").length<1){
    return;
  }
  if (quoted.split("\n")[0].split("סוג: ")[1] ==="הזמנה"){
    // await client.acceptGroupV4Invite(textToInviteV4(quoted.body));
  }else if(quoted.split("\n")[0].split("סוג: ")[1] ===("קישור")){
    await sock.groupAcceptInvite(textToGroupLink(quoted).split(".com/")[1]);
  }else{
    return;
  }
  await sock.sendMessage(message.key.remoteJid, {text: "בוצע"}, {quoted: message});
};

module.exports = procCommand;

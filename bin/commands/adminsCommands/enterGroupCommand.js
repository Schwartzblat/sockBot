const {privilegedUsers} = require('../../../config/admins.json');
const isAdmin = (message) => {
  return message.key.fromMe || privilegedUsers.includes(message.key.participant || message.key.remoteJid);
};
/**
 * @param {string} text
 */
const textToInviteV4 = (text)=>{
  const lines = text.split("\n");
  return {
    from: lines[1].split("from: ")[1].trim()+"@s.whatsapp.net",
    groupJid: lines[2].split("groupJid: ")[1].trim(),
    inviteCode: lines[3].split("inviteCode: ")[1].trim(),
    inviteExpiration: lines[4].split("inviteExpiration: ")[1].trim(),
  };
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
 *
 * @param {makeWASocket} sock
 * @param {string} code
 * @param {string} expiration
 * @param {string} admin
 * @param {string} groupJid
 * @return {Promise<number|string|null>}
 */
const joinToGroupByInvite = async (sock, code, expiration, admin, groupJid)=> {
  try {
    const res = await sock.query({
      tag: 'iq',
      attrs: {
        type: 'set',
        xmlns: 'w:g2',
        to: groupJid,
      },
      content:[{ tag: 'accept', attrs: { code , expiration, admin}}]
    });
    return res.attrs.from;
  } catch (err) {
    console.log('Unable to join group', err);
  }
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
    const inviteMessage = textToInviteV4(quoted);
    await joinToGroupByInvite(sock, inviteMessage.inviteCode, inviteMessage.inviteExpiration, inviteMessage.from, inviteMessage.groupJid);
  }else if(quoted.split("\n")[0].split("סוג: ")[1] ===("קישור")){
    await sock.groupAcceptInvite(textToGroupLink(quoted).split(".com/")[1]);
  }else{
    return;
  }
  await sock.sendMessage(message.key.remoteJid, {text: "בוצע"}, {quoted: message});
};

module.exports = procCommand;

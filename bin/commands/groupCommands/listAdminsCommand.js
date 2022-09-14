const {isPrivilegedId, isGammaAdminId} = require('../../utils/permissionsUtils');


/**
 *
 * @param {proto.IWebMessageInfo} message
 * @param {makeWASocket} sock
 * @return {Promise<void>}
 */
const procMessage = async (message, sock) => {
    if(!message.key.remoteJid.endsWith("@g.us")){
        return;
    }
    const chat = await sock.groupMetadata(message.key.remoteJid);
    const admins = chat.participants.filter((par)=>{
        return par.admin||isGammaAdminId(par.id)||isPrivilegedId(par.id);
    })
    let output = '';
    for(const admin of admins){
        output+=`@${admin.id.split("@")[0]}\n`;
    }
    await sock.sendMessage(message.key.remoteJid, {text: output}, {quoted: message});
}

module.exports = procMessage;

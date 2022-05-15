const {removeFirstWord} = require("../../utils/stringUtils");

/**
 * @param {proto.IWebMessageInfo} message
 * @param {makeWASocket} sock
 * @return {Promise<void>}
 */
const procCommand = async (message, sock) => {
    const emoji = removeFirstWord(message.body);
    if (emoji.length === 0) {
        return;
    }
    let key = message.key;
    if(message?.message?.extendedTextMessage?.contextInfo?.quotedMessage){
        key = {
            remoteJid: message.key.remoteJid,
            id: message.message.extendedTextMessage.contextInfo.stanzaId,
            participant: message.message.extendedTextMessage.contextInfo.participant
        }
    }
    const reactionMessage = {
        react: {
            text: emoji,
            key: key
        }
    }
    await sock.sendMessage(message.key.remoteJid, reactionMessage);
};
module.exports = procCommand;

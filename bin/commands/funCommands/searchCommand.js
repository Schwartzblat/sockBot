const {removeFirstWord} = require('../../utils/stringUtils');
const { generateWAMessageFromContent, proto, generateMessageID} = require('@adiwajshing/baileys')
const base = 'https://googlethatforyou.com';
/**
 * @param {proto.IWebMessageInfo} message
 * @param {makeWASocket} sock
 * @return {Promise<void>}
 */
const procCommand = async (message, sock) => {
    const text = removeFirstWord(message.body);
    if(!text||text.length===0){
        return;
    }
    const output = base+"?q="+encodeURIComponent(text);
    // await sock.relayMessage(message.key.remoteJid, template.message, template.key.id);
    await sock.sendMessage(message.key.remoteJid, {text: output});
};
module.exports = procCommand;

const {getContentType} = require("@adiwajshing/baileys");
const {imageMessageToSticker, videoMessageToSticker} = require("../../utils/mediaHelper");

const getSticker = async (message)=>{
  if (!message){
    return;
  }
  switch(getContentType(message)){
    case "imageMessage":
      return await imageMessageToSticker(message, undefined);
    case "videoMessage":
      return await videoMessageToSticker(message, undefined);
    case "extendedTextMessage":
      return await getSticker(message?.extendedTextMessage?.contextInfo?.quotedMessage);
    default:
      return;
  }
}
/**
 * Process sticker command.
 *
 * @param {proto.IWebMessageInfo} message
 * @param {makeWASocket} sock
 * @return {Promise<void>}
 */
const procCommand = async (message, sock) => {

  const sticker = await getSticker(message.message);
  if (!sticker){
    return;
  }
  await sock.sendMessage(message.key.remoteJid, {sticker: await sticker}, {quoted: message});
};

module.exports = procCommand;

const {getContentType} = require("@adiwajshing/baileys");
const {imageToSticker, videoToSticker, downloadMedia} = require("../../utils/mediaHelper");

const getSticker = async (message)=>{
  if (!message){
    return;
  }
  switch(getContentType(message)){
    case "imageMessage":
      return await imageToSticker(message, undefined);
    case "videoMessage":
      return await videoToSticker(message, undefined);
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
  await sock.sendMessage(message.key.remoteJid, {sticker: await sticker.toBuffer()}, {quoted: message});
};

module.exports = procCommand;

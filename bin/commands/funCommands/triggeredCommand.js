const Jimp = require('jimp');
const path = require('path');
const {tmpdir} = require('os');
const fs = require('fs');
const {getRandomIntInclusive, genUUID} = require('../../utils/random');
const {filePathToSticker} = require('../../utils/mediaHelper');
const {getContentType} = require('@adiwajshing/baileys');

const defaultImagePath = path.resolve(__dirname,
    '../../../public/defaultProfilePic.png');
const framesCount = 10;

/**
 * Add fry filter to the image.
 *
 * @param {Jimp} image - the image to be processed.
 */
const fry = (image) => {
  image.dither565();
  image.posterize(16);
  image.contrast(0.5);
  image.color([
    {apply: 'red', params: [0.5]},
    {apply: 'green', params: [0.5]},
    {apply: 'blue', params: [0.5]},
  ]);
};

/**
 * Draws triggered banner on the image.
 *
 * @param {Jimp} image
 * @return {Promise<void>}
 */
const drawTriggeredBanner = async (image) => {
  const triggeredBanner = await Jimp.read(
      './public/triggered/triggeredBanner.png');
  const imageWidth = image.bitmap.width;
  const imageHeight = image.bitmap.height;
  triggeredBanner.resize(imageWidth, imageHeight * 0.2);
  image.composite(triggeredBanner, 0, imageHeight * 0.8);
};

/**
 * Moves image randomly each frame, and saves it to the disk.
 * @param {Jimp} image
 * @return {Promise<string>} - path to the frames' folder.
 */
const createFrames = async (image) => {
  const framesFolder = path.resolve(
      tmpdir(),
      genUUID(),
  );
  fs.mkdirSync(framesFolder);
  for (let i = 0; i < framesCount; i++) {
    const frame = new Jimp(image.bitmap.width, image.bitmap.height);
    const xOffset = getRandomIntInclusive(-6, 6);
    const yOffset = getRandomIntInclusive(-6, 6);
    frame.composite(image, xOffset, yOffset);
    await frame.writeAsync(`${framesFolder}/${i}.png`);
  }
  return framesFolder + '/%d.png';
};

/**
 * Generates the triggered sticker.
 *
 *
 * @param {string} phone - the jid of the user.
 * @param {makeWASocket} sock - the socket of the bot.
 * @return {Promise<Buffer>} - the triggered sticker.
 */
const generateTriggeredSticker = async (phone, sock) => {
  const profilePicUrl = await sock.profilePictureUrl(phone, 'image').
      catch(() => {
        return defaultImagePath;
      });
  const profilePic = await Jimp.read(profilePicUrl);
  fry(profilePic);
  await drawTriggeredBanner(profilePic);
  const framesPath = await createFrames(profilePic);
  const ffmpegOptions = {
    input: [
      '-stream_loop', '3',
      '-f', 'image2',
    ],
  };
  const sticker = await filePathToSticker(framesPath, ffmpegOptions);
  fs.rmSync(path.dirname(framesPath), {recursive: true});
  return sticker;
};

/**
 * Processes the triggered command.
 *
 * @param {IWebMessageInfo} message
 * @param {makeWASocket} sock
 * @return {Promise<void>}
 */
const procCommand = async (message, sock) => {
  let quotedMessage;
  // The selected phone should be set in this order:
  // 1. The user who sent the command
  // 2. The user who sent the message quoted
  // 3. The user who was mentioned
  let phone = message.key.participant || message.key.remoteJid;
  if (getContentType(message.message) === 'extendedTextMessage' &&
      message.message.extendedTextMessage.contextInfo.quotedMessage) {
    const contextInfo = message.message.extendedTextMessage.contextInfo;
    phone = contextInfo.participant;
    // Grab the quoted message for later.
    quotedMessage = {
      key: {
        remoteJid: message.key.remoteJid,
        id: contextInfo.stanzaId,
        participant: contextInfo.participant,
      },
      message: contextInfo.quotedMessage,
    };
  }
  // Does this work?
  phone = message.message?.extendedTextMessage?.contextInfo?.
      mentionedJid?.[0] || phone;
  if (!phone) {
    return;
  }
  const triggeredSticker = await generateTriggeredSticker(phone, sock);
  const messageOptions = {
    quoted: quotedMessage ? quotedMessage : message,
  };
  await sock.sendMessage(message.key.remoteJid, {sticker: triggeredSticker},
      messageOptions);
};

module.exports = procCommand;

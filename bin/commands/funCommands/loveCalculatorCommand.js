const Jimp = require('jimp');
const profilePicMaskPath = './public/loveCalculator/profilePicMask.png';
const fontPath = './public/loveCalculator/fonts/names.fnt';
const stringUtils = require('../../utils/stringUtils');
const {getRandomIntInclusive} = require('../../utils/random');
const {shadow} = require('../../utils/imageEffects');
const {Sticker} = require('wa-sticker-formatter');
const path = require('path');
const defaultImagePath = path.resolve(__dirname,
    '../../../public/defaultProfilePic.png');
const {isPrivileged} = require('../../utils/permissionsUtils');


/**
 *
 * @param {makeInMemoryStore} store
 * @param {string} phone
 * @return {string}
 */
const getNameByPhone = (store, phone) => {
  return (store.contacts[phone]?.notify ||
      store.contacts[phone]) || phone.split('@')[0];
};

/**
 * Returns a random number between 0 and 100, uses names as seed.
 *
 * @param {string} phone1
 * @param {string} phone2
 * @return {number}
 */
const getLovePercentage = (phone1, phone2) => {
  const namesArray = [phone1, phone2].sort();
  return getRandomIntInclusive(0, 100, {seed: namesArray[1] + namesArray[0]});
};

/**
 * Expend and add shadow to profile pic, expended by 40x40;
 *
 * @param {Jimp} profilePic
 * @return {Promise<Jimp>}
 */
const shadowProfilePic = async (profilePic) => {
  return (await shadow(profilePic, 40, 40,
      {opacity: 0.2, size: 1, blur: 10, x: 0, y: 0}));
};

/**
 * Uses mask on profile pic.
 *
 * @param {Jimp} profilePic
 * @return {Promise<Jimp>}
 */
const maskProfilePic = async (profilePic) => {
  const profilePicMask = await Jimp.read(profilePicMaskPath);
  await profilePicMask.resize(profilePic.getWidth(), profilePic.getHeight());
  return (await profilePic.mask(profilePicMask, 0, 0));
};

/**
 *
 * @param {Jimp} image
 * @param {string}  profilePicUrl
 * @param {boolean} onRight
 * @return {Promise<void>}
 */
const drawProfilePic = async (image, profilePicUrl, onRight) => {
  const downloadedPic = await Jimp.read(profilePicUrl).
      catch((err) => console.log(err));
  if (!downloadedPic) {
    return;
  }
  await downloadedPic.resize(230, 230);

  const profilePicComp = await shadowProfilePic(
      await maskProfilePic(downloadedPic));

  const x = onRight ? 230 : 0;
  const y = onRight ? 230 : 0;
  await image.composite(profilePicComp, x, y);
};

const drawProfileName = async (image, name, onRight) => {
  const font = await Jimp.loadFont(fontPath);

  const fontHeight = Jimp.measureTextHeight(font, name, 230);
  const x = onRight ? 20 : 250;
  const y = onRight ? 480 - fontHeight : 20;

  await image.print(
      font,
      x,
      y,
      {
        text: stringUtils.reverseHe(name),
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
      },
      230);
};

const drawLovePercentage = async (image, percentage) => {
  const font = await Jimp.loadFont(
      './public/loveCalculator/fonts/percentageFont.fnt');
  const text = percentage.toString() + '%';
  const textWidth = Jimp.measureText(font, text);
  const textHeight = Jimp.measureTextHeight(font, text, 260);
  const fontBuffer = new Jimp(image.getWidth(), image.getHeight());
  await fontBuffer.print(
      font,
      (image.getWidth() - textWidth) / 2 + 4,
      (image.getHeight() - textHeight) / 2 - 10,
      text,
  );
  await shadow(fontBuffer, 0, 0, {opacity: 0.2, size: 1, blur: 10, x: 0, y: 0});
  await image.composite(fontBuffer, 0, 0);
};

const drawHeart = async (image, filledPercentage) => {
  if (filledPercentage >= 0) {
    filledPercentage = Math.min(filledPercentage, 100);
    const heartEmpty = await Jimp.read(
        './public/loveCalculator/heartEmpty.png');
    await heartEmpty.resize(230, 230);
    const heartFilled = await Jimp.read(
        './public/loveCalculator/heartFilled.png');
    await heartFilled.resize(230, 230);

    const heightBar = heartEmpty.getHeight() * (100 - filledPercentage) / 100;
    await heartFilled.crop(0, heightBar, heartFilled.getWidth(),
        heartFilled.getHeight() - heightBar);
    const heartComp = await heartEmpty.composite(heartFilled, 0, heightBar);

    const heartRender = await shadow(heartComp, 40, 40,
        {opacity: 0.3, size: 1, blur: 10, x: 0, y: 0});

    const x = (image.getWidth() - heartRender.getWidth()) / 2;
    const y = (image.getHeight() - heartRender.getHeight()) / 2;
    await image.composite(heartRender, x, y);
  } else {
    const heartBroken = await Jimp.read(
        './public/loveCalculator/heartBroken.png');
    await heartBroken.resize(250, 230);
    const heartRender = await shadow(heartBroken, 40, 40,
        {opacity: 0.3, size: 1, blur: 10, x: 0, y: 0});
    const x = (image.getWidth() - heartRender.getWidth()) / 2;
    const y = (image.getHeight() - heartRender.getHeight()) / 2;
    await image.composite(heartRender, x, y);
  }
};

const addDecoration = async (image) => {
  const decorations = await Jimp.read(
      './public/loveCalculator/decorations.png');

  await image.composite(decorations, 0, 0);
};

/**
 *
 * @param {string} phone1
 * @param {string} phone2
 * @param {makeWASocket} sock
 * @param {makeInMemoryStore} store
 * @param {number} lovePercentage
 * @return {Promise<Jimp>}
 */
const generateLoveImage = async (
    phone1, phone2, sock, store, lovePercentage = undefined) => {
  const loveImage = await Jimp.read(
      './public/loveCalculator/loveBackground.png');
  const image1 = await sock.profilePictureUrl(phone1, 'image').catch((err) => {
    return defaultImagePath;
  });
  const image2 = await sock.profilePictureUrl(phone2, 'image').catch((err) => {
    return defaultImagePath;
  });
  await drawProfilePic(loveImage, image1, false);
  await drawProfilePic(loveImage, image2, true);
  const name1 = getNameByPhone(store, phone1);
  const name2 = getNameByPhone(store, phone2);

  await drawProfileName(loveImage, name1, false);
  await drawProfileName(loveImage, name2, true);

  if (!lovePercentage) {
    lovePercentage = getLovePercentage(phone1.split('@')[0],
        phone2.split('@')[0]);
  }

  await drawHeart(loveImage, lovePercentage);
  await drawLovePercentage(loveImage, lovePercentage);

  await addDecoration(loveImage);

  return (await loveImage);
};

/**
 * Processes love calculator command.
 *
 * @param {proto.IWebMessageInfo} message
 * @param {makeWASocket} sock
 * @param {makeInMemoryStore} store
 * @return {Promise<void>}
 */
const procCommand = async (message, sock, store) => {
  if (!message.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
    return;
  }
  const mentions = message.message.extendedTextMessage.contextInfo.mentionedJid;
  if (mentions.length === 1) {
    mentions.push(message.key.participant || message.key.remoteJid);
  }
  let lovePercentage = undefined;
  if (isPrivileged(message)) {
    const messageParts = message.body.split(' ');
    if (messageParts.length > 1 &&
        !isNaN(messageParts[messageParts.length - 1])) {
      lovePercentage = parseInt(messageParts[messageParts.length - 1]);
    }
  }

  const loveImage = await generateLoveImage(mentions[0], mentions[1], sock,
      store, lovePercentage);
  const loveBuffer = await loveImage.getBufferAsync(Jimp.MIME_PNG);
  const sticker = new Sticker(loveBuffer, {
    pack: 'pack',
    author: 'author',
    type: 'full',
    quality: 100,
  });
  const buffer = await sticker.toBuffer();
  await sock.sendMessage(message.key.remoteJid, {sticker: buffer},
      {quoted: message});
};

module.exports = procCommand;

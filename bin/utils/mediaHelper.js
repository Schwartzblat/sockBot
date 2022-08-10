const {getContentType, downloadContentFromMessage} = require(
    '@adiwajshing/baileys');
const path = require('path');
const axios = require('axios');
const {tmpdir} = require('os');
const Crypto = require('crypto');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const dataUri = require('datauri');
const {Sticker, StickerTypes} = require('wa-sticker-formatter');
const {genUUID} = require('./random.js');
const sharp = require('sharp');
const Settings = require('../../config/mediaHelper.json');

let dataURIToBuffer;
const load = async () => {
  dataURIToBuffer = (await import('data-uri-to-buffer')).dataUriToBuffer;
};
load();

/**
 * Notice, this piece of code
 */

/**
 * Sticker metadata.
 * @typedef {Object} StickerMetadata
 * @property {string} [name]
 * @property {string} [author]
 * @property {string[]} [categories]
 */

/**
 * Formats webp to a sticker.
 * @param {buffer} data - sticker in webp format.
 * @param {StickerMetadata} metadata - the metadata of the sticker.
 *
 * @returns {Promise<Buffer>} buffer containing the sticker and ready to be
 * sent.
 */
const formatWebpSticker = async (data, metadata) => {
  if (metadata.name || metadata.author) {
    const img = new webp.Image();
    const hash = this.generateHash(32);
    const stickerPackId = hash;
    const packname = metadata.name;
    const author = metadata.author;
    const categories = metadata.categories || [''];
    const json = {
      'sticker-pack-id': stickerPackId,
      'sticker-pack-name': packname,
      'sticker-pack-publisher': author,
      'emojis': categories,
    };
    let exifAttr = Buffer.from([
      0x49,
      0x49,
      0x2A,
      0x00,
      0x08,
      0x00,
      0x00,
      0x00,
      0x01,
      0x00,
      0x41,
      0x57,
      0x07,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x16,
      0x00,
      0x00,
      0x00]);
    let jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
    let exif = Buffer.concat([exifAttr, jsonBuffer]);
    exif.writeUIntLE(jsonBuffer.length, 14, 4);
    await img.load(Buffer.from(webpMedia.data, 'base64'));
    img.exif = exif;
    webpMedia.data = (await img.save(null)).toString('base64');
  }

  return webpMedia;
};

const formatImageToWebp = async (data) => {
  const img = sharp(data).webp({
    quality: Settings.image.quality,
    lossless: Settings.image.lossless,
    effort: Settings.image.effort,
  });

  img.resize(512, 512, {
    fit: sharp.fit.contain,
    background: {r: 0, g: 0, b: 0, a: 0},
  });

  return img.toBuffer();
};

const formatVideoToWebp = async (data, type) => {
  const steam = new (require('stream').Readable)();
  steam.push(data);
  steam.push(null);
  return await _webpProcessor(steam, type);
};

/**
 * Creates a sticker out of a message containing a photo.
 *
 * @param {IMessage} message - the message you want to operate on.
 * @param {string} [pack='botPack'] - the name of the pack.
 * @param {string} [author='boti'] - the name of the author.
 * @return {Promise<Sticker>} - the sticker.
 */
const imageMessageToSticker = async (
    message, pack = 'botPack', author = 'boti') => {
  const buffer = await downloadMedia(message);
  return new Sticker(buffer, {
    pack: pack,
    author: author,
    type: StickerTypes.FULL,
  });
};

/**
 * Creates a sticker out of dataURI encoded image.
 *
 * @param {string} dataURI - the dataURI encoded image.
 * @param {string} [pack='botPack'] - the name of the pack.
 * @param {string} [author='boti'] - the name of the author.
 * @return {Promise<Sticker>} - the sticker.
 */
const dataURIToSticker = async (dataURI, pack = 'botPack', author = 'boti') => {
  const buffer = dataURIToBuffer(dataURI);
  return new Sticker(buffer, {
    pack: pack,
    author: author,
    type: StickerTypes.FULL,
  });
};

/**
 * Creates a sticker out of a message containing a video.
 *
 * @param {IMessage} message
 * @param {string} [pack='botPack'] - the name of the pack.
 * @param {string} [author='boti'] - the name of the author.
 * @return {Promise<Sticker>} - the sticker.
 */
const videoMessageToSticker = async (
    message, pack = 'botPack', author = 'boti') => {
  if (message.videoMessage.gifPlayback) {
    return;
  }

  const videoBuffer = await downloadMedia(message);
  const videoType = message.videoMessage.mimetype.split('/')[1];
  const buffer = await videoBufferToWebp(videoBuffer, videoType);

  return new Sticker(buffer, {
    pack: pack,
    author: author,
    type: StickerTypes.FULL,
    quality: 10,
  });
};

/**
 * Formats a webp(sticker formatted) from a path, this may be a path to a video
 * or a path to a folder containing frames.
 *
 * This method unlinks temp files after it is done.
 *
 * @param {string} filePath - the path to the file.
 * @param {string} [fileType] - the type(format) of the file.
 * @param {string[]} [inputOptions[]] - the options for ffmpeg.
 * @return {Promise<Buffer>}
 */
const filePathToWebp = async (filePath, fileType = '', inputOptions = []) => {
  if (fileType && !inputOptions.includes('-f')) {
    inputOptions.push('-f', fileType);
  }

  return await _webpProcessor(filePath, inputOptions);
};

/**
 * Formats a video buffer to webp(sticker formatted).
 *
 * This method unlinks temp files after it is done.
 *
 * @param {Buffer} videoBuffer - the video you want to format in buffer format.
 * @param {string} videoType - the type(format) of the video.
 * @param {string[]} [inputOptions[]] - the options for ffmpeg.
 * @return {Promise<Buffer>} - the formatted video in buffer format.
 */
const videoBufferToWebp = async (videoBuffer, videoType, inputOptions = []) => {
  const stream = new (require('stream').Readable)();
  stream.push(videoBuffer);
  stream.push(null);

  if (!inputOptions.includes('-f')) {
    inputOptions.push('-f', videoType);
  }

  return await _webpProcessor(stream, inputOptions);
};

/**
 * Formats a file/stream to webp sticker format.
 * DISCLAIMER: YOU ARE RESPONSIBLE FOR USING A VALID BITRATE, PASS IT VIA THE
 * INPUT OPTIONS WITH THE KEY '-b:v'.
 *
 * This method unlinks temp files after it is done.
 *
 * @param {string|stream.internal.Readable} video - the video you want to format.
 * @param {string[]} inputOptions - the options you want to pass to ffmpeg.
 * @return {Promise<Buffer>}
 * @private
 */
const _webpProcessor = async (video, inputOptions) => {
  const tempFile = path.join(
      tmpdir(),
      `${genUUID()}.webp`,
  );

  await new Promise((resolve, reject) => {
    const ffmpegWorker = ffmpeg(video);
    ffmpegWorker.
        on('error', reject).
        on('end', () => resolve(true));
    if (inputOptions.length > 0) {
      ffmpegWorker.inputOptions(inputOptions);
    }
    // These options are stolen from whatsapp-web.js repo, and should format a
    // video to a sticker fine. Though, it seems as Whatsapp Web has some sort
    // of sticker processor of their own which is incredibly useful in slimming
    // down the size of the video. Further research is needed, and this may
    ffmpegWorker.addOutputOptions([
      '-vcodec',
      'libwebp',
      '-vf',
      // eslint-disable-next-line no-useless-escape
      'scale=\'iw*min(300/iw\,300/ih)\':\'ih*min(300/iw\,300/ih)\',format=rgba,pad=300:300:\'(300-iw)/2\':\'(300-ih)/2\':\'#00000000\',setsar=1,fps=10',
      '-loop',
      '0',
      '-ss',
      '00:00:00.0',
      '-t',
      Settings.video.maxDuration,
      '-preset',
      'default',
      '-an',
      // FIXME: This is deprecated, change to modern string method.
      '-vsync',
      '0',
      '-s',
      '512:512',
      '-compression_level',
      Settings.video.effort,
      '-lossless',
      Settings.video.lossless.toString(),
      '-qscale',
      Settings.video.quality,
      '-fs',
      Settings.video.maxSize,
    ]);
    ffmpegWorker.toFormat('webp');
    ffmpegWorker.save(tempFile);
  });

  const data = fs.readFileSync(tempFile);
  fs.unlinkSync(tempFile);
  return data;
};

/**
 * Creates an animated sticker from a list of frames.
 *
 * @param {string} framesPath - the path to the frames.
 * @param {string[]} [inputOptions] - the options to pass to ffmpeg.
 * @param {string} pack - the name of the pack.
 * @param {string} author - the name of the author.
 * @return {Promise<Sticker>}
 */
const framesToSticker = async (
    framesPath, inputOptions = [], pack = 'botPack', author = 'boti') => {
  const videoBuffer = await filePathToWebp(framesPath, undefined, inputOptions);
  return new Sticker(videoBuffer, {
    pack: pack,
    author: author,
    type: StickerTypes.FULL,
    quality: 7,
  });
};

/**
 * Creates a buffer out of the media attached to a message.
 *
 * @param {IMessage} message - the message.
 * @returns {Promise<Buffer>} - the attached media in buffer format.
 */
const downloadMedia = async (message) => {
  let stream;
  switch (getContentType(message)) {
    case 'imageMessage':
      stream = await downloadContentFromMessage(message.imageMessage, 'image');
      break;
    case 'videoMessage':
      stream = await downloadContentFromMessage(message.videoMessage, 'video');
      break;
    case 'audioMessage':
      stream = await downloadContentFromMessage(message.audioMessage, 'audio');
      break;
    default:
      return null;
  }
  let buffer = Buffer.from([]);
  for await(const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk]);
  }
  return buffer;
};

/**
 * The functions transforms gifs to mp4. Because of the limitations of ffmpeg,
 * both the input and the output are files.
 *
 * @param {string} gifDataUri - the gif you want to convert in dataUri format.
 * @return {Promise<string>}
 */
const gifToMp4 = async (gifDataUri) => {
  const tempInputFile = path.join(tmpdir(),
      `processing.
      ${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}
      .gif`);
  const tempOutputFile = path.join(tmpdir(),
      `processing.
      ${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}
      .mp4`);
  fs.writeFileSync(tempInputFile, dataUriToBuffer(gifDataUri));
  await new Promise((resolve, reject) => {
    ffmpeg(tempInputFile).inputFormat('gif').outputOptions([
      '-movflags faststart',
      '-pix_fmt yuv420p',
    ]).videoFilter([
      {
        filter: 'scale',
        options: 'trunc(iw/2)*2:trunc(ih/2)*2',
      },
    ]).toFormat('mp4').on('error', function(err) {
      reject(err);
    }).on('end', function() {
      resolve(true);
    }).save(tempOutputFile);
  });
  const outputDataUri = await dataUri(tempOutputFile);
  fs.unlinkSync(tempOutputFile);
  fs.unlinkSync(tempInputFile);
  return outputDataUri;
};

/**
 *
 * @param {string} url
 * @return {Promise<Buffer>}
 */
const urlToBuffer = async (url) => {
  const response = await axios.get(url, {responseType: 'arraybuffer'});
  return Buffer.from(response.data, 'utf-8');
};

module.exports = {
  imageMessageToSticker,
  videoMessageToSticker,
  videoBufferToWebp,
  filePathToWebp,
  framesToSticker,
  downloadMedia,
  dataURIToSticker,
  urlToBuffer,
};

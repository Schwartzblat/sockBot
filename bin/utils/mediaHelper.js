const {getContentType, downloadContentFromMessage} = require(
    '@adiwajshing/baileys');
const path = require('path');
const axios = require('axios');
const {tmpdir} = require('os');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
// eslint-disable-next-line no-unused-vars
const {Exif, Metadata} = require('wa-sticker-formatter');
const {genUUID} = require('./random.js');
const sharp = require('sharp');
const Settings = require('../../config/mediaHelper.json');

/* Whatsapp tends to act funky with stickers approximately over 1mb. An ideal
 * solution would be to cap the size of the sticker at 1mb, yet because of the
 * limitations of ffmpeg and libwebp, we can only try to achieve this by aiming
 * at creating lower sized stickers.
 *
 * Most encoders seem to work fine with limiting the bitrate, however this
 * doesn't seem to be the case for libwebp. As an example, without limiting the
 * bitrate, a sticker with a size of 1.2mb will be created, but when limiting
 * the bitrate to 10kb the sticker will be 0.8mb! This is too unacceptably
 * unstable for us to use.
 *
 * Another solution would be to use "-fs 1mb", which tries to limit the size of
 * the sticker by stopping the writing of data after 1mb, but still, this
 * feature was meant to be used on larger files with an error of around 1-2%,
 * but for us this generates a worst case of approximately 1.2mb! This is
 * unacceptable too. So our best option is to put heavy compression on the
 * sticker, and target a size of 0.8mb with -fs.
 */

/**
 * FFmpeg's options container.
 * Encapsulates both the input and output options.
 *
 * @typedef {Object} FFmpegOptions
 * @property {string[]} input - the input options.
 * @property {string[]} output - the output options.
 */

/**
 * Formats webp to a sticker.
 *
 * @param {Buffer} data - webp media.
 * @param {Metadata} [metadata] - the metadata of the sticker.
 * @return {Promise<Buffer>} buffer containing the finished sticker.
 */
const formatWebpSticker = async (data, metadata = Settings.defaultMetadata) => {
  return new Exif(metadata).add(data);
};

/**
 * Formats image(stored in buffer) to webp.
 *
 * @param {Buffer} data - the image to process.
 * @return {Promise<Buffer>} - the webp image.
 */
const formatImageToWebp = async (data) => {
  const img = sharp(data).webp({
    quality: Settings.image.quality,
    lossless: Settings.image.lossless,
    effort: Settings.image.effort,
  });

  img.resize(512, 512, {
    fit: sharp.fit.contain,
    background: {'r': 0, 'g': 0, 'b': 0, 'alpha': 0},
  });

  return img.toBuffer();
};

/**
 * Formats a video(stored in buffer) to webp.
 *
 * @param {Buffer} data - the video to process.
 * @param {string} type - the file format of the video.
 * @param {FFmpegOptions} [ffmpegOptions={}] - the processing options for
 * ffmpeg.
 * @return {Promise<Buffer>} - the webp video.
 */
const formatVideoToWebp = async (data, type, ffmpegOptions = {}) => {
  ffmpegOptions = _normalizeFFmpegOptions(ffmpegOptions);
  // Input format must be set.
  if (!ffmpegOptions.input.includes('-f')) {
    ffmpegOptions.input.push('-f', type);
  }

  return await _webpProcessor(data, ffmpegOptions);
};

/**
 * Formats a file/stream to webp sticker format.
 *
 * @param {string|Buffer} video - the video you want to format.
 * @param {FFmpegOptions} ffmpegOptions={} - the processing options for ffmpeg.
 * @return {Promise<Buffer>}
 * @private
 */
const _webpProcessor = async (video, ffmpegOptions) => {
  // FFmpeg doesn't like to work with streams, so instead we use temp files.
  let inputFile = video;
  if (video instanceof Buffer) {
    const fileType = ffmpegOptions.input[ffmpegOptions.input.indexOf('-f') + 1];
    inputFile = _saveBufferToFile(video, fileType);
  }
  const outputFile = _genTempPath('webp');

  await new Promise((resolve, reject) => {
    const ffmpegWorker = ffmpeg(inputFile);
    ffmpegWorker.on('error', reject);
    ffmpegWorker.on('end', () => resolve(true));
    ffmpegWorker.inputOptions(ffmpegOptions.input);
    ffmpegWorker.outputOptions([
      '-vcodec',
      'libwebp',
      '-vf',
      // eslint-disable-next-line max-len
      `scale=\'iw*min(300/iw\,300/ih)\':\'ih*min(300/iw\,300/ih)\',format=rgba,pad=300:300:\'(300-iw)/2\':\'(300-ih)/2\':\'#00000000\',setsar=1,fps=${Settings.video.fps}`,
      '-loop',
      '0',
      '-ss',
      '00:00:00.0',
      '-t',
      Settings.video.maxDuration,
      '-preset',
      'default',
      '-an',
      '-fps_mode',
      'passthrough',
      '-s',
      '512:512',
      '-compression_level',
      Settings.video.effort,
      '-lossless',
      Settings.video.lossless,
      '-quality',
      Settings.video.quality,
    ]);
    ffmpegWorker.outputOptions(ffmpegOptions.output);
    ffmpegWorker.toFormat('webp');
    ffmpegWorker.save(outputFile);
  });

  const data = fs.readFileSync(outputFile);
  fs.unlinkSync(outputFile);
  if (video instanceof Buffer) {
    fs.unlinkSync(inputFile);
  }
  return data;
};

/**
 * Creates a sticker out of a message containing a photo.
 *
 * @param {IMessage} message - the message you want to operate on.
 * @param {Metadata} [metadata] - the metadata of the sticker.
 * @return {Promise<Buffer>} - the sticker.
 */
const imageMessageToSticker = async (
    message, metadata = Settings.defaultMetadata) => {
  const media = await downloadMedia(message);
  const pImage = await formatImageToWebp(media);
  return formatWebpSticker(pImage, metadata);
};

/**
 * Creates a sticker out of a message containing a video.
 *
 * @param {IMessage} message
 * @param {Metadata} [metadata]
 * @return {Promise<Buffer>} - the sticker.
 */
const videoMessageToSticker = async (
    message, metadata = Settings.defaultMetadata) => {
  const videoBuffer = await downloadMedia(message);
  const videoType = message.videoMessage.mimetype.split('/')[1];
  const pVideo = await formatVideoToWebp(videoBuffer, videoType);
  return formatWebpSticker(pVideo, metadata);
};

/**
 * Creates a webp buffer from a path, this may be a path to a
 * video or a path to a folder containing frames.
 *
 * @param {string} filePath - the path to the file.
 * @param {FFmpegOptions} [ffmpegOptions] - the options for ffmpeg.
 * @return {Promise<Buffer>}
 */
const filePathToWebp = async (filePath, ffmpegOptions = {}) => {
  ffmpegOptions = _normalizeFFmpegOptions(ffmpegOptions);

  // Get file extension.
  const fileType = path.extname(filePath).slice(1);
  if (!ffmpegOptions.input.includes('-f')) {
    const formats = await _getFFmpegFormats();
    // Check if file extension is a format in ffmpeg.
    // Also take care of images.
    if (fileType in formats) {
      ffmpegOptions.input.push('-f', fileType);
    } else if (fileType === 'jpg' || fileType === 'jpeg' || fileType ===
            'png') {
      ffmpegOptions.input.push('-f', 'image2');
    }
  }

  return await _webpProcessor(filePath, ffmpegOptions);
};

/**
 * Creates a sticker out of a path, can also be a path to a glob of files.
 *
 * @param {string} filePath - the path to the file.
 * @param {FFmpegOptions} [ffmpegOptions] - the options for ffmpeg.
 * @param {Metadata} [metadata] - the metadata of the sticker.
 * @return {Promise<Buffer>}
 */
const filePathToSticker = async (
    filePath, ffmpegOptions = {}, metadata = Settings.defaultMetadata) => {
  ffmpegOptions = _normalizeFFmpegOptions(ffmpegOptions);
  const videoBuffer = await filePathToWebp(filePath, ffmpegOptions);
  return formatWebpSticker(videoBuffer, metadata);
};

/**
 * Creates a buffer out of the media attached to a message.
 *
 * @param {IMessage} message - the message.
 * @return {Promise<Buffer>} - the attached media in buffer format.
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
  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk]);
  }
  return buffer;
};

/**
 * Turns a resource from a url to a buffer.
 *
 * @param {string} url - the url of the resource.
 * @return {Promise<Buffer>} - the resource in buffer format.
 */
const urlToBuffer = async (url) => {
  const response = await axios.get(url, {responseType: 'arraybuffer'});
  return Buffer.from(response.data, 'utf-8');
};

/**
 * Returns all formats available in ffmpeg.
 *
 * @return {Promise<unknown>}
 * @private
 */
const _getFFmpegFormats = async () => {
  return await new Promise((resolve, reject) => {
    ffmpeg.availableFormats((err, formats) => {
      if (err) {
        reject(err);
      } else {
        resolve(formats);
      }
    });
  });
};

/**
 * Merges provided options with the default options.
 *
 * @param {FFmpegOptions} ffmpegOptions - the options to normalize.
 * @return {FFmpegOptions} - the merged options.
 * @private
 */
const _normalizeFFmpegOptions = (ffmpegOptions) => {
  return {
    ...{input: [], output: []},
    ...ffmpegOptions,
  };
};

/**
 * Generate a path for a temporary file.
 *
 * @param {string} [extension] - the extension of the file.
 * @return {string} - the path to the temporary file.
 * @private
 */
const _genTempPath = (extension = '') => {
  return path.join(
      tmpdir(),
      `${genUUID()}${extension ? `.${extension}` : ''}`,
  );
};

/**
 * Saves a buffer to a temporary file.
 * DISCLAIMER: BE SURE TO UNLINK THE FILE AFTER USAGE.
 *
 * @param {buffer} buffer - the buffer to save.
 * @param {string} extension - the extension of the file.
 * @return {string} - the path to the temporary file.
 * @private
 */
const _saveBufferToFile = (buffer, extension = '') => {
  const filePath = _genTempPath(extension);
  fs.writeFileSync(filePath, buffer);
  return filePath;
};

module.exports = {
  formatWebpSticker,
  formatImageToWebp,
  formatVideoToWebp,
  imageMessageToSticker,
  videoMessageToSticker,
  filePathToWebp,
  filePathToSticker,
  downloadMedia,
  urlToBuffer,
};

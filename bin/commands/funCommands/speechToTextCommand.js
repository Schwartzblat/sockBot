const execa = require('execa');
const path = require('path');
const util = require('util');
const tmpdir = require('os').tmpdir;
const Crypto = require('crypto');
const fs = require('fs');
const {getContentType} = require('@adiwajshing/baileys');
const {downloadMedia} = require('../../utils/mediaHelper');
/**
 * Returns a random temp path.
 *
 * @param {string} mimeType
 * @return {string}
 */
const generateTempPath = (mimeType) => {
  return path.join(tmpdir(),
      'processing-' +
      Crypto.randomBytes(6).readUIntLE(0, 6).toString(36) +
      '.' + mimeType);
};

/**
 * saving file to path.
 *
 * @param {Buffer} buffer
 * @param {string} mimeType
 * @return {string} tempPath
 */
const saveFileToTempPath = async (buffer, mimeType) => {
  const binaryData = buffer.toString('binary');
  const tempPath = generateTempPath(mimeType);
  await fs.writeFileSync(tempPath, binaryData,
      'binary');
  const newTempPath = tempPath.split('.')[0] + '.wav';
  await execa('ffmpeg', ['-i', tempPath, newTempPath]);
  return newTempPath;
};

/**
 * Process speechToText command.
 *
 * @param {proto.IWebMessageInfo}message
 * @param {makeWASocket} sock
 * @return {Promise<void>}
 */
const procCommand = async (message, sock) => {

  if (getContentType(message.message)!=="extendedTextMessage" || getContentType(message.message?.extendedTextMessage?.contextInfo?.quotedMessage) !== "audioMessage") {
    return;
  }
  const media = await downloadMedia(message.message.extendedTextMessage.contextInfo.quotedMessage);
  if (media.length >20*1000000){
    await sock.sendMessage(message.key.remoteJid, {text: "הקלטה זו ארוכה מדי"}, {quoted: message});
    return;
  }
  const mimetype = message.message.extendedTextMessage.contextInfo.quotedMessage.audioMessage.mimetype.split(";")[0].split("/")[1];
  const tempPath = await saveFileToTempPath(media, mimetype);
  const res = await execa('python', [
    path.resolve(
        __dirname + '../../../pythonScripts/speechToText.py'),
    tempPath]);
  const file = fs.readFileSync(
      path.resolve(__dirname, '..\\..\\pythonScripts\\temp1.txt'), 'utf8');
  // Remove temp files.
  try {
    fs.unlinkSync(tempPath);
    fs.unlinkSync(tempPath.split('.')[0] +"." + mimetype);
  } catch (err) {
    console.error(err);
  }
  if (res['failed']) {
    console.log(util.inspect(res));
    return;
  }
  const output = 'התמלול של ההודעה הסתיים:' + '\n' + file.toString();
  await sock.sendMessage(message.key.remoteJid, {text: output}, {quoted: message});
};

module.exports = procCommand;

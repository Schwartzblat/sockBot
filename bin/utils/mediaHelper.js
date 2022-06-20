const {getContentType, downloadContentFromMessage} = require("@adiwajshing/baileys");
const path = require("path");
const axios = require("axios");
const {tmpdir} = require("os");
const Crypto = require("crypto");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const dataUri = require("datauri");
const {Sticker, StickerTypes} = require("wa-sticker-formatter")
let dataURIToBuffer;
const load = async()=>{
    dataURIToBuffer = (await import('data-uri-to-buffer')).dataUriToBuffer;
}
load();
const imageToSticker = async (message, pack="botPack", author="boti") => {
    const buffer = await downloadMedia(message);
    return new Sticker(buffer, {
        pack: pack,
        author: author,
        type: StickerTypes.FULL,
    });
}

const dataURIToSticker = async (dataURI, pack="botPack", author="boti") => {
    const buffer = dataURIToBuffer(dataURI);
    return new Sticker(buffer, {
        pack: pack,
        author: author,
        type: StickerTypes.FULL
    });
}

const videoToSticker = async (message, pack="botPack", author="boti") => {
    if (message.videoMessage.gifPlayback){
        return;
    }

    const buffer = await formatVideoToWebp(message);

    return new Sticker(buffer, {
        pack: pack,
        author: author,
        type: StickerTypes.FULL,
        quality: 10
    });
}

/**
 *
 * @param {IMessage} message
 * @return {Promise<Buffer>}
 */
const formatVideoToWebp = async (message) => {
    const tempFile = path.join(
        tmpdir(),
        `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`
    );

    const stream = new (require('stream').Readable)();
    const buffer = await downloadMedia(message);
    stream.push(buffer);
    stream.push(null);

    const videoType = message.videoMessage.mimetype.split("/")[1];

    await new Promise((resolve, reject) => {
        ffmpeg(stream)
            .inputFormat(videoType)
            .on('error', reject)
            .on('end', () => resolve(true))
            .addOutputOptions([
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
                '00:00:05.0',
                '-preset',
                'default',
                '-an',
                '-vsync',
                '0',
                '-s',
                '512:512',
            ])
            .toFormat('webp')
            .save(tempFile);
    });

    const data = fs.readFileSync(tempFile);
    fs.unlinkSync(tempFile);
    return data;
}

/**
 * @param {proto.IMessage} message
 * @returns {Promise<Buffer>}
 */
const downloadMedia = async (message)=>{
    let stream;
    switch (getContentType(message)){
        case "imageMessage":
            stream = await downloadContentFromMessage(message.imageMessage, "image");
            break;
        case "videoMessage":
            stream = await downloadContentFromMessage(message.videoMessage, "video");
            break;
        case "audioMessage":
            stream = await downloadContentFromMessage(message.audioMessage, "audio");
            break;
        default:
            return;
    }
    let buffer = Buffer.from([])
    for await(const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
    }
    return buffer;
}

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
    const response = await axios.get(url,  { responseType: 'arraybuffer'})
    return Buffer.from(response.data, "utf-8")
}






module.exports = {
    imageToSticker,
    videoToSticker,
    downloadMedia,
    dataURIToSticker,
    urlToBuffer
}

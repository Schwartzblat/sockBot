const axios = require('axios').default;
const {removeFirstWord} = require('../../utils/stringUtils');
const {urlToBuffer} = require('../../utils/mediaHelper');
/**
 * Process sentiment command.
 *
 * @param {proto.IWebMessageInfo} message
 * @param {makeWASocket} sock
 * @return {Promise<void>}
 */
const procCommand = async (message, sock) => {
  let param = parseInt(removeFirstWord(message.body));
  if (isNaN(param) || param < 1 || param > 100) {
    param = 1;
  }

  // Request part.
  const options = {
    method: 'GET',
    url: 'https://www.n12.co.il/AjaxPage?jspName=getNewsChatMessages.jsp&count=100',
  };
  const response = await axios.request(options);
  // Only continue if status is ok.
  if (response.status !== 200) {
    return;
  }
  const report = response.data[param - 1];
  const reporter = report['reporter'];
  let output = reporter['reporter']['name'] + ':\n';
  let media;
  if (report['medias'].length === 0) {
    output += report['messageContent'];
  } else {
    output += report['medias'][0]['mediaContent'];
    if (report['medias'][0]['link3']) {
      media = report['medias'][0]['link3'];
    } else if (report['medias'][0]['link2']) {
      media = report['medias'][0]['link2'];
    } else if (report['medias'][0]['link1']) {
      media = report['medias'][0]['link1'];
    }
  }
  if (media) {
    switch (media.split('.')[media.split('.').length - 1]) {
      case 'jpg':
      case 'png':
        await sock.sendMessage(message.key.remoteJid,
            {caption: output, image: await urlToBuffer(media)},
            {quoted: message});
        return;
      case 'mp4':
        await sock.sendMessage(message.key.remoteJid,
            {caption: output, video: await urlToBuffer(media)},
            {quoted: message});
        return;
      default:
        await sock.sendMessage(message.key.remoteJid,
            {text: 'פורמט לא נתמך: ' + media}, {quoted: message});
        return;
    }
  } else {
    await sock.sendMessage(message.key.remoteJid, {text: output},
        {quoted: message});
  }
};

module.exports = procCommand;

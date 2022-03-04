const axios = require('axios').default;
const translator = require('../../utils/translator').translateString;
const ApiKeys = require('../../../config/apiKeys.json');
const {getContentType} = require("@adiwajshing/baileys");
const faceRecognitionCommand = require('../funCommands/faceRecognitionCommand.js');
/**
 * Process sentiment command.
 *
 * @param {proto.IWebMessageInfo} message
 * @param {makeWASocket} sock
 * @return {Promise<void>}
 */
const procCommand = async (message, sock) => {
  const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  if (!quotedMessage) {
    return;
  }else if(getContentType(quotedMessage)==="imageMessage"){
    const contextInfo = message.message.extendedTextMessage.contextInfo;
    const msg = {
      key: {
        remoteJid: message.key.remoteJid,
        id: contextInfo.stanzaId,
        participant: contextInfo.participant
      },
      message: contextInfo.quotedMessage
    }
    await faceRecognitionCommand(msg, sock);
    return;
  }
  const quote = quotedMessage.conversation;
  if (!quote) {
    return;
  }
  const translatedQuote = await translator(quote);
  // Request part.
  const options = {
    method: 'POST',
    url: 'https://text-sentiment.p.rapidapi.com/analyze',
    headers: {
      'content-type': 'application/json',
      'x-rapidapi-key':  ApiKeys['sentiment-analysis4.p.rapidapi.com'],
      'x-rapidapi-host': 'text-sentiment.p.rapidapi.com'
    },
    data: {text: translatedQuote}
  };

  const res = await axios.request(options).catch((error) => {

  });
  if (!res || res.status !== 200) {
    return;
  }
  const resData = res.data;
  let output = '*ניתוח ההודעה בוצע*' + '\n';
  output += 'ו--------------------------------ו' + '\n';
  output += 'אחוזי חיוביות: ' + parseFloat(resData['pos_percent']).toFixed(2) + '%\n';
  output += 'אחוזי שליליות: ' + parseFloat(resData['neg_percent']).toFixed(2) + '%\n';
  output += 'אחוזי נייטרליות: ' + parseFloat(resData['mid_percent']).toFixed(2)+'%';
  const contextInfo = message.message.extendedTextMessage.contextInfo;
  const msg = {
    key: {
      remoteJid: message.key.remoteJid,
      id: contextInfo.stanzaId,
      participant: contextInfo.participant
    },
    message: contextInfo.quotedMessage
  }
  await sock.sendMessage(message.key.remoteJid, {text: output}, {quoted: msg});
};

module.exports = procCommand;

const {removeFirstWord} = require('../../utils/stringUtils');
const yargs = require('yargs/yargs');
const {description, title} = require('../../../config/survey.json');
const {getContentType} = require('@adiwajshing/baileys');
const {downloadMedia} = require('../../utils/mediaHelper');

/**
 * Process survey command.
 *
 * @param {String} command
 * @return {String[]}
 */
const parseCommand = (command) => {
  return yargs(command).argv['_'].map((item) => item.split('"')[1]);
};

/**
 * Process survey command.
 *
 * @param {proto.IWebMessageInfo} message
 * @param {makeWASocket} sock
 * @return {Promise<void>}
 */
const surveyCommand = async (message, sock) => {
  const command = removeFirstWord(message.body);
  const parsed = parseCommand(command);
  if (parsed.includes(' ') || !parsed[0]) {
    return;
  }
  const optionsObjects = [];
  for (let i = 1; i < parsed.length; i++) {
    if (!parsed[i]) {
      return;
    }
    optionsObjects.push(
        {buttonId: 'id' + i, buttonText: {'displayText': parsed[i]}, type: 1});
  }
  let buttonMessage;
  if (getContentType(message.message) === 'imageMessage') {
    buttonMessage = {
      caption: parsed[0],
      footer: description,
      buttons: optionsObjects,
      image: await downloadMedia(message.message),
      headerType: 4,
    };
  } else {
    buttonMessage = {
      title: title,
      text: parsed[0],
      footer: description,
      buttons: optionsObjects,
    };
  }
  await sock.sendMessage(message.key.remoteJid, buttonMessage);
};

/**
 * Process survey command.
 *
 * @param {proto.IWebMessageInfo} message
 * @param {makeWASocket} sock
 * @param {makeInMemoryStore} store
 * @return {Promise<void>}
 */
const surveyResults = async (message, sock, store) => {
  const quotedBase =
      message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  if (!quotedBase || !quotedBase.buttonsMessage) {
    return;
  }
  const contextInfo = message.message.extendedTextMessage.contextInfo;
  const quoted = {
    key: {
      remoteJid: message.key.remoteJid,
      id: contextInfo.stanzaId,
      participant: contextInfo.participant,
    },
    message: contextInfo.quotedMessage,
  };
  const buttonsText = quotedBase.buttonsMessage.buttons.map(
      (button) => button.buttonText.displayText);
  const buttonsId = quotedBase.buttonsMessage.buttons.map(
      (button) => button.buttonId);
  const chatId = message.key.remoteJid;
  const counter = new Map();
  for (let i = 0; i < buttonsId.length; i++) {
    counter.set(buttonsId[i], 0);
  }
  const voted = [];
  const messages = store.messages[chatId].array;
  for (let i = messages.length - 1; i > -1; i--) {
    if (messages[i].key.id === quoted.key.id) {
      break;
    }
    if (!messages[i]?.message?.buttonsResponseMessage ||
        messages[i].message.buttonsResponseMessage.contextInfo.stanzaId !==
        quoted.key.id) {
      continue;
    }

    if (counter.has(
        messages[i]?.message?.buttonsResponseMessage?.selectedButtonId) &&
        !voted.includes(
            messages[i].key.participant || messages[i].key.remoteJid)) {
      counter.set(messages[i].message.buttonsResponseMessage.selectedButtonId,
          counter.get(
              messages[i].message.buttonsResponseMessage.selectedButtonId) + 1);
      voted.push(messages[i].key.participant || messages[i].key.remoteJid);
    }
  }

  let output = 'תוצאות הסקר הן: ' + '\n';
  for (let i = 0; i < buttonsText.length; i++) {
    output += buttonsText[i] + ': ' + counter.get(buttonsId[i]) + '\n';
  }
  await sock.sendMessage(message.key.remoteJid, {text: output},
      {quoted: quoted});
};

module.exports = {surveyCommand, surveyResults};

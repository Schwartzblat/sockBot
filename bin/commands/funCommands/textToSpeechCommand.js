const axios = require('axios').default;
const {removeFirstWord} = require('../../utils/stringUtils');
const apiKeys = require('../../../config/apiKeys.json');
const privilegedUsers = require('../../../config/admins.json').privilegedUsers;

const isAdmin = (message) => {
  return message.key.fromMe || privilegedUsers.includes(message.key.participant || message.key.remoteJid);
};
/**
 * Process sentiment command.
 *
 * @param {proto.IWebMessageInfo} message
 * @param {makeWASocket} sock
 * @return {Promise<void>}
 */
const procCommand = async (message, sock) => {
  const text = removeFirstWord(message.body);
  if (!text || text.length < 3 || text.length > 400 || !isAdmin(message)) {
    return;
  }

  // Request part.
  const options = {
    method: 'GET',
    url: 'https://api.voicerss.org/',
    params: {
      key: apiKeys['api.voicerss.org'],
      src: text,
      hl: 'he-il',
      r: '-2',
      c: 'mp3',
      b64: true,
    },
  };
  const response = await axios.request(options);
  if (response.status !== 200) {
    return;
  }
  const regex = /^data:.+\/(.+);base64,(.*)$/;

  const matches = response.data.match(regex);
  const data = matches[2];
  const buffer = Buffer.from(data, 'base64');
  await sock.sendMessage(message.key.remoteJid, {audio: buffer}, {quoted: message});
};

module.exports = procCommand;

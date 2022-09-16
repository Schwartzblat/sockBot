const axios = require('axios');
const ApiKeys = require('../../../config/apiKeys.json');
const {removeFirstWord} = require('../../utils/stringUtils');

const categories = ['Misc', 'Programming', 'Dark', 'Pun', 'Spooky', 'Christmas'];
/**
 * @param {proto.IWebMessageInfo} message
 * @param {makeWASocket} sock
 * @return {Promise<void>}
 */
const procCommand = async (message, sock) => {
  let category = removeFirstWord(message.body);
  if (category) {
    category = category[0].toUpperCase() + category.substring(1);
  }
  if (!categories.includes(category)) {
    category = 'Any';
  }
  const requestOptions = {
    method: 'GET',
    url: 'https://jokeapi-v2.p.rapidapi.com/joke/'+category,
    params: {
      format: 'json',
    },
    headers: {
      'x-rapidapi-key':
                ApiKeys['corona-virus-world-and-india-data.p.rapidapi.com'],
      'x-rapidapi-host': 'jokeapi-v2.p.rapidapi.com',
    },
  };
    // The api request part.
  const res = await axios.request(requestOptions);
  // Well, we don't want an error.
  if (res.status !== 200) {
    return;
  }
  const data = res.data;
  let output = '*קטגוריה:* '+data['category']+'\n';
  if (data['type'] === 'single') {
    output += '*הבדיחה:* \n'+data['joke']+'\n';
  } else {
    output += '*הבדיחה:* \n'+data['setup']+'\n'+data['delivery']+'\n';
  }
  let status = true;
  for (const flag in data['flags']) {
    if (data['flags'][flag]) {
      if (status) {
        output += '*סיווג בדיחה:* '+'\n';
        status = false;
      }
      output += flag + '\n';
    }
  }
  await sock.sendMessage(message.key.remoteJid, {text: output}, {quoted: message});
};

module.exports = procCommand;

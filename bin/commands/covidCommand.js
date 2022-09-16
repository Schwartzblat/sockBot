const covidIsrael = require('../covid19/covidIsrael');
const covidCity = require('../covid19/covidCity');
const covidCountry = require('../covid19/covidCountry');

/**
 * Process covid command.
 *
 * @param {proto.IWebMessageInfo} message
 * @param {makeWASocket} sock
 * @return {Promise<void>}
 */
const procCommand = async (message, sock) => {
  if (message.message.conversation.split(' ').length === 1) {
    await covidIsrael(message, sock);
  } else {
    if (await covidCity(message, sock)) {
      return;
    }
    await covidCountry(message, sock);
  }
};

module.exports = procCommand;

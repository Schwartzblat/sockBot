const {getRandomIntInclusive} = require('../../utils/random');

/**
 * Process random number command.
 *
 * @param {proto.IWebMessageInfo} message
 * @param {makeWASocket} sock
 * @return {Promise<void>}
 */
const procCommand = async (message, sock) => {
  let min = parseInt(message.body.split(' ')[1]);
  let max = parseInt(message.body.split(' ')[2]);
  if (isNaN(max) || isNaN(min)) {
    return;
  }
  if (max < min) {
    const temp = min;
    min = max;
    max = temp;
  }
  let output = getRandomIntInclusive(min, max).toString();
  if(output==='infinity'){
    output = 'מספר זה גדול מדי.'
  }
  await sock.sendMessage(message.key.remoteJid, {text: output}, {quoted: message});
};

module.exports = procCommand;

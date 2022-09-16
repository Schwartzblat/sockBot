const axios = require('axios');
const apiKeys = require(
    '../../../config/apiKeys.json');

/**
 *
 * @param {proto.IWebMessageInfo} message
 * @param {makeWASocket} sock
 * @return {Promise<void>}
 */
const procCommand = async (message, sock) => {
  const cityName = encodeURIComponent(
      message.body.substr(message.body.indexOf(' ')).trim());
  const url = 'https://api.openweathermap.org/data/2.5/weather?q=' + cityName +
      '&lang=he&units=metric&appid=' +
      apiKeys['api.openweathermap.org'];
  const requestOptions = {
    method: 'GET',
    url: url,
  };
  const res = await axios.request(requestOptions).
      catch((err) => err);
  if (!res || res.status !== 200) {
    return;
  }
  const data = res.data;
  let output = 'מזג האוויר ל' + data['name'] + ':\n';
  output += 'מדינה: ' + data['sys']['country'] + '\n';
  output += 'תיאור כללי: ' + data['weather'][0]['description'] + '\n';
  output += 'טמפרטורה: ' + data['main']['temp'] + ', מרגיש כמו ' +
      data['main']['feels_like'] + '\n';
  output += 'לחות: ' + data['main']['humidity'] + '%\n';
  output += 'רוח: ' + data['wind']['speed'] + ' קמ"ש בכיוון ' +
      data['wind']['deg'] + ' מעלות' + '\n';

  await sock.sendMessage(message.key.remoteJid, {text: output}, {quoted: message});
};

module.exports = procCommand;

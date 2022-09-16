const axios = require('axios');
const apiKey = require(
    '../../config/apiKeys.json')['https://api.openweathermap.org'];

/**
 * Process covid Israel command.
 *
 * @param {proto.IWebMessageInfo} message
 * @param {makeWASocket} sock
 * @return {Promise<void>}
 */
const procCommand = async (message, sock) => {
  const cityName = encodeURIComponent(message.body.substr(7).trim());
  const url = 'https://api.openweathermap.org/data/2.5/weather?q=' + cityName +
      '&lang=he&units=metric&appid=' + apiKey;
  const requestOptions = {
    method: 'GET',
    url: url,
  };
  // Request part.
  const res = await axios.request(requestOptions).
      catch((err) => {
        return err;
      });
  if (res.status !== 200) {
    return;
  }
  const data = res.data;
  // Process data for message.
  let output = 'מזג האוויר ל ' + data['name'] + ':\n';
  output += 'מדינה: ' + data['sys']['country'] + '\n';
  output += 'קואורדינטות: ' + data['coord']['lon'] + ', ' +
      data['coord']['lat'] + '\n';
  output += 'תיאור כללי: ' + data['weather'][0]['description'] + '\n';
  output += 'טמפרטורה: ' + data['main']['temp'] + ', מרגיש כמו ' +
      data['main']['feels_like'] + '\n';
  output += 'לחות: ' + data['main']['humidity'] + '%\n';
  output += 'רוח: ' + data['wind']['speed'] + ' קמ"ש בכיוון ' +
      data['wind']['deg'] + ' מעלות' + '\n';

  await sock.sendMessage(message.key.remoteJid, {text: output}, {quoted: message});
};

module.exports.procCommand = procCommand;

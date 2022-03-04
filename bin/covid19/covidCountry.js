const translator = require('../utils/translator').translateString;
const axios = require('axios');
const ApiKeys = require('../../config/apiKeys.json');
const {removeFirstWord} = require('../utils/stringUtils');
const requestOptions = {
  method: 'GET',
  url: 'https://corona-virus-world-and-india-data.p.rapidapi.com/api',
  headers: {
    'x-rapidapi-key':
        ApiKeys['corona-virus-world-and-india-data.p.rapidapi.com'],
    'x-rapidapi-host': 'corona-virus-world-and-india-data.p.rapidapi.com',
  },
};

/**
 * Process covid country command.
 *
 * @param {proto.IWebMessageInfo} message
 * @param {makeWASocket} sock
 * @return {Promise<void>}
 */
const procCommand = async (message, sock) => {
  const reqCountryName = removeFirstWord(message.body);
  let translatedReqCountryName = await translator(reqCountryName);

  switch (translatedReqCountryName) {
    case 'United States':
      translatedReqCountryName = 'USA';
      break;
    case 'England':
      translatedReqCountryName = 'UK';
      break;
    case 'Rumania':
      translatedReqCountryName = 'Romania';
      break;
    case 'Czech Republic':
      translatedReqCountryName = 'Czechia';
      break;
    case 'United Arab Emirates':
      translatedReqCountryName = 'UAE';
      break;
  }

  const res = await axios.request(requestOptions);
  if (res.status !== 200) {
    return;
  }
  const country = res.data['countries_stat'].find((countryEntry) =>
      countryEntry['country_name'].toUpperCase() ===
      translatedReqCountryName.toUpperCase());
  if (!country) {
    return;
  }

  let output = '*----' + reqCountryName + '----*\n';
  output += country['cases'] + ' חולים מתחילת המגפה' + '\n';
  output += country['deaths'] + ' מתים מתחילת המגיפה' + '\n';
  output += country['total_recovered'] + ' מחלימים מתחילת המגיפה' + '\n';
  output += country['new_deaths'] + ' מתים חדשים' + '\n';
  output += country['new_cases'] + ' חולים חדשים' + '\n';
  output += country['serious_critical'] + ' חולים במצב קשה' + '\n';
  output += country['active_cases'] + ' חולים פעילים' + '\n';
  output += country['total_cases_per_1m_population'] + ' חולים למיליון איש' +
      '\n';
  output += country['deaths_per_1m_population'] + ' מתים למיליון איש';

  await sock.sendMessage(message.key.remoteJid, {text: output}, {quoted: message});
};

module.exports = procCommand;

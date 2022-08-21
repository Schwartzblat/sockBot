const axios = require('axios');
const {removeFirstWord} = require('../utils/stringUtils');

const reqPayload = JSON.stringify({
  'requests': [
    {
      'id': '0',
      'queryName': 'spotlightPublic',
      'single': false,
      'parameters': {},
    },
  ],
});

const reqOptions = {
  method: 'POST',
  url: 'https://datadashboardapi.health.gov.il/api/queries/_batch',
  data: reqPayload,
  headers: {
    'Host': 'datadashboardapi.health.gov.il',
    'sec-ch-ua': 'Hey There',
    'Content-Type': 'application/json',
    'Content-Length': 81,
  },
};

/**
 * Returns a string with color data on a specific city according to Israel's
 * ministry of health.
 *
 * @param {number} score
 * @return {string}
 */
const getColorName = (score) => {
  if (score < 4.5) {
    return '🟢 ירוק';
  } else if (score < 6) {
    return '🟡 צהוב';
  } else if (score < 7) {
    return 'כתום בהיר🟠🟡';
  } else if (score < 7.5) {
    return '🟠 כתום';
  } else {
    return '🔴 אדום';
  }
};

const fixCityName = (cityName) => {
  switch (cityName) {
    case 'תל אביב':
      return 'תל אביב - יפו';
    default:
      return cityName;
  }
};

/**
 * Process covid city command.
 *
 * @param {proto.IWebMessageInfo} message
 * @param {makeWASocket} sock
 * @return {Promise<void>}
 */
const procCommand = async (message, sock) => {
  const res = await axios.request(reqOptions).catch((err) => console.log(err));
  if (res.status !== 200) {
    return;
  }

  const cityData = res.data[0].data;
  const reqCityName = fixCityName(removeFirstWord(message.body));
  const reqCity =
      cityData.find((cityEntry) => cityEntry['name'] === reqCityName);

  if (!reqCity) {
    return;
  }

  // Form message content.
  let output = '*----' + reqCityName + '----*\n';
  output += 'צבע: ' + getColorName(reqCity['score']) + ' (' + reqCity['score'] +
      '/10)' + '\n';
  output += 'חולים פעילים ל10,000 תושבים: ' + reqCity['activeSickTo1000'] +
      '\n';
  output += 'אחוז בדיקות חיוביות: ' +
      (reqCity['positiveTests'] * 100).toFixed(1) + '%\n';
  output += 'שיעור שינוי המאומתים: ' +
      (reqCity['growthLastWeek'] * 100).toFixed(1) + '%\n';
  output += 'חולים פעילים: ' + reqCity['activeSick'] + '\n';
  output += 'חיסון ראשון: ' + reqCity['firstDose'] + '%\n';
  output += 'חיסון שני: ' + reqCity['secondDose'] + '%\n';
  output += 'חיסון שלישי: ' + reqCity['thirdDose'] + '%\n';
  output += 'חולים חדשים ל10,000 תושבים: ' + reqCity['sickTo10000'];

  await sock.sendMessage(message.key.remoteJid, {text: output},
      {quoted: message});
};

module.exports = procCommand;

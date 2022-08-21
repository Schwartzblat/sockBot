const axios = require('axios').default;
const {removeFirstWord} = require('../../utils/stringUtils');

/**
 * Format car id.
 *
 * @param {string} id - car id.
 * @return {string} formatted id.
 */
const formatCarId = (id) => {
  if (id.length === 7) {
    return id.substring(0, 2) + '-' + id.substring(2, 5) + '-' +
        id.substring(5, 7);
  } else if (id.length === 8) {
    return id.substring(0, 3) + '-' + id.substring(3, 5) + '-' +
        id.substring(5, 8);
  }
};

/**
 * Process car command.
 *
 * @param {proto.IWebMessageInfo} message
 * @param {makeWASocket} sock
 * @return {Promise<void>}
 */
const procCommand = async (message, sock) => {
  const carId = removeFirstWord(message.body);
  if (carId.length > 10 || carId.length <= 6 || isNaN(parseInt(carId))) {
    return;
  }
  // Request part.
  const options = {
    method: 'GET',
    url: 'https://data.gov.il/api/3/action/datastore_search',
    params: {
      'resource_id': '053cea08-09bc-40ec-8f7a-156f0677aff3',
      'q': carId,
    },
  };
  const response = await axios.request(options).catch((err) => {
    return err;
  });
  if (!response || response.status !== 200 || !response.data['success']) {
    return;
  }
  const data = response.data.result.records[0];
  if (!data) {
    return;
  }
  let output = 'מספר רכב: ' + formatCarId(String(data['mispar_rechev'])) + '\n';
  output += 'תוצרת רכב: ' + data['tozeret_nm'] + '\n';
  output += 'דגם: ' + data['kinuy_mishari'] + '\n';
  output += 'צבע: ' + data['tzeva_rechev'] + '\n';
  output += 'בעלות: ' + data['baalut'] + '\n';
  output += 'סוג דלק: ' + data['sug_delek_nm'] + '\n';
  output += 'דגם מנוע: ' + data['degem_manoa'] + '\n';
  output += 'שנת ייצור: ' + data['shnat_yitzur'] + '\n';
  output += 'קבוצת זיהום: ' + data['kvutzat_zihum'] + '\n';
  output += 'רמת אבזור בטיחותי: ' + data['ramat_eivzur_betihuty'] + '\n';

  await sock.sendMessage(message.key.remoteJid, {text: output},
      {quoted: message});
};

module.exports = procCommand;

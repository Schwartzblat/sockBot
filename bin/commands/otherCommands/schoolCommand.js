const {removeFirstWord} = require('../../utils/stringUtils');
const axios = require('axios');

const listUrl = 'https://shkifut.education.gov.il/api/data/lists';
const baseUrl = 'https://shkifut.education.gov.il/api/data/mosad/?semelMosad=';

/**
 *
 * @return {Promise<object>}
 */
const getSchoolList = async () => {
  const response = await axios.get(listUrl).catch((err) => err);
  if (!response || response.status !== 200) {
    return;
  }
  return response.data['infoLists'];
};

/**
 * Checks if object is empty.
 *
 * @param {object} obj
 * @return {boolean}
 */
const isEmpty = (obj) => {
  return Object.keys(obj).length === 0;
};

/**
 *
 * @param {string} schoolName
 * @return {Promise<number>}
 */
const findSchool = async (schoolName) => {
  const lists = await getSchoolList();
  if (!lists) {
    return -1;
  }
  const indexes = {};
  const parts = schoolName.split(' ');
  for (const item of lists) {
    for (let i = 0; i < parts.length; i++) {
      if (item.n.includes(parts[i]) || (item.a && item.a.includes(parts[i]))) {
        if (!indexes[item.s]) {
          indexes[item.s] = 1;
        } else {
          indexes[item.s] += 1;
        }
      }
    }
  }
  if (isEmpty(indexes)) {
    return -1;
  }
  let max = 0;
  let found = indexes[0];
  for (const key in indexes) {
    if (indexes[key] >= max) {
      max = indexes[key];
      found = key;
    }
  }
  return found;
};

/**
 * @param {proto.IWebMessageInfo} message
 * @param {makeWASocket} sock
 * @return {Promise<void>}
 */
const procCommand = async (message, sock) => {
  const schoolName = removeFirstWord(message.body);
  const schoolId = await findSchool(schoolName);
  if (!schoolId || schoolId === -1) {
    return;
  }
  const response = await axios.get(baseUrl + schoolId + '&year=2020').
      catch((err) => err);
  if (!response || response.status !== 200) {
    return;
  }
  const data = response.data;
  let output = '';
  output += 'שם: ' + data?.['mosadGenaralData']?.['SHEM_MOSAD'] + '\n';
  output += 'פיקוח: ' + data?.['mosadYearData']?.['PIKOH_YY'] + '\n';
  output += 'מספר תלמידים: ' + (data?.['mosadYearData']?.['BANIM'] +
      data?.['mosadYearData']?.['BANOT']) + '\n';
  output += 'ממוצע תלמידים בכיתה: ' +
      data?.['mosadYearData']?.['MISPAR_TALMIDIM_BE_KITA'] + '\n';
  output += 'עלות תלמיד ממוצע: ' + data?.['mosadYearData']?.['ALUT_TALMID'] +
      ' שקל\n';

  const eduPictureResponse = await axios.get(
      'https://shkifut.education.gov.il/api/data/mosadEduPic/?semelMosad=' +
      schoolId).catch((err) => err);
  if (!eduPictureResponse || eduPictureResponse.status !== 200) {
    return;
  }
  const eduData = eduPictureResponse.data;
  output += 'אחוז זכות לבגרות: ' + (eduData?.groups?.find(
      (group) => group.Name === 'בגרות')?.['Classes']?.[1] ||
      eduData?.groups?.find((group) => group.Name ===
          'בגרות')?.['Classes']?.[0])?.['Indexes']?.[0]?.['Value'] + '%\n';
  output += 'אחוז גיוס: ' +
      (eduData?.groups?.[0]?.['Classes']?.[0]?.['Indexes']?.find(
          (obj) => obj?.['Name'] === 'גיוס לשירות צבאי בנים')?.['Value'] +
          eduData?.groups?.[0]?.['Classes']?.[0]?.['Indexes']?.find(
              (obj) => obj?.['Name'] === 'גיוס לשירות צבאי בנות')?.['Value']) /
      2 + '%\n';
  await sock.sendMessage(message.key.remoteJid, {text: output},
      {quoted: message});
};
module.exports = procCommand;

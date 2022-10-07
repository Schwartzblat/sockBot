const axios = require('axios');
const {removeFirstWord} = require('../../utils/stringUtils');
const Settings = require('../../../config/gimatria.json');
const fs = require('fs');
const path = require('path');
const safeGroupsPath = path.resolve(__dirname, '../../../config/safeGroups.json');
/**
 *
 * @param {proto.IWebMessageInfo} message
 * @return {Promise<boolean>}
 */
const isSafeGroup = async (message)=>{
  const safeGroups = JSON.parse(await fs.readFileSync(safeGroupsPath));
  return safeGroups.includes(message.key.remoteJid);
};


/**
 * Process gimatria command.
 *
 * @param {proto.IWebMessageInfo} message
 * @param {makeWASocket} sock
 * @return {Promise<void>}
 */
const procCommand = async (message, sock) => {
  if (removeFirstWord(message.body).length===0 || await isSafeGroup(message)) {
    return;
  }
  const requestParams = {
    'instr': removeFirstWord(message.body),
  };
  const requestOptions = {
    method: 'GET',
    url: Settings.url,
    params: requestParams,
  };
  const res = await axios.request(requestOptions).
      catch((err) => console.log(err));
  if (res.status !== 200) {
    return;
  }
  const data = res.data;
  let sum; let sameSum;
  try {
    sum = data.match(
        new RegExp('התאמות משאילתות הגולשים לתוצאה .*', 'g'))[0].split(
        '<')[0].split(' ')[4];
    sameSum = data.match(
        new RegExp('(<li>((?!([a-zA-z])).)+<\/li>)|(\\);\">(.+)<\/a>)', 'g')).
        sort(() => Math.random() - 0.5).
        slice(0, Settings.numberOfEquivalents).
        map((item) => item.split('>')[1].split('<')[0].trim());
  } catch (er) {
    return;
  }

  let output = 'החישוב למילה ' + removeFirstWord(message.body) +
      ' הסתיים בהצלחה' + '\n';
  output += removeFirstWord(message.body) + ' יוצא ' + sum + ' בגימטריה' +
      '\n';
  output += 'עוד מילים עם אותה תוצאה:' + '\n';
  for (let i = 0; i < sameSum.length; i++) {
    output += sameSum[i] + '\n';
  }
  await sock.sendMessage(message.key.remoteJid, {text: output},
      {quoted: message});
};

module.exports = procCommand;

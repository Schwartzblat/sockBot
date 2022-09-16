const axios = require('axios');
const {removeFirstWord} = require('../../utils/stringUtils');
const iconv = new (require('iconv').Iconv)('CP1255', 'UTF-8//TRANSLIT//IGNORE');
/**
 * Process gimatria command.
 *
 * @param {proto.IWebMessageInfo} message
 * @param {makeWASocket} sock
 * @return {Promise<void>}
 */
const procCommand = async (message, sock) => {
  let url = null;
  switch (removeFirstWord(message.body).split(' ')[0]) {
    case '11':
      url = encodeURI('https://www.isramedia.net/לוח-שידורים/1/ערוץ-כאן-11-שידור-חי');
      break;
    case '12':
      url = encodeURI('https://www.isramedia.net/לוח-שידורים/12/ערוץ-12-שידור-חי');
      break;
    case '13':
      url = encodeURI('https://www.isramedia.net/לוח-שידורים/13/ערוץ-13-שידור-חי');
      break;
    case '41':
      url = encodeURI('https://www.isramedia.net/לוח-שידורים/378/ערוץ-דיסקברי');
      break;
    case '43':
      url = encodeURI('https://www.isramedia.net/לוח-שידורים/141/ערוץ-נשיונל-גיאוגרפיק');
      break;
    case '50':
      url = encodeURI('https://www.isramedia.net/לוח-שידורים/12564/ערוץ-one-שידור-חי');
      break;
    case '51':
      url = encodeURI('https://www.isramedia.net/לוח-שידורים/56/ספורט-1');
      break;
    case '52':
      url = encodeURI('https://www.isramedia.net/לוח-שידורים/91/ספורט-2');
      break;
    case '53':
      url = encodeURI('https://www.isramedia.net/לוח-שידורים/14950/ספורט-3');
      break;
    case '54':
      url = encodeURI('https://www.isramedia.net/לוח-שידורים/14951/ספורט-4');
      break;
    case '55':
      url = encodeURI('https://www.isramedia.net/לוח-שידורים/5/ספורט-5-שידור-חי');
      break;

    default:
      return;
  }
  let day = removeFirstWord(message.body).split(' ');
  if (day.length===1) {
    day=0;
  } else {
    switch (day[1]) {
      case '1':
        day = 1;
        break;
      case '2':
        day = 2;
        break;
      case 'מחר':
        day = 1;
        break;
      case 'מחרתיים':
        day = 2;
        break;
      default:
        day = 0;
        break;
    }
  }
  const requestOptions = {
    method: 'GET',
    url: url,
    params: {
      'days': day,
    },
    responseType: 'arraybuffer',
  };

  const res = await axios.request(requestOptions).
      catch((err) => console.log(err));
  if (res.status !== 200) {
    return;
  }
  const data = iconv.convert(res.data).toString();
  const names = data.match(new RegExp('<td class="tvguideshowname">.*</td>', 'g')).map((item)=>item.split('>')[1].split('<')[0].trim());
  const startingTimes = data.match(new RegExp('<td class="tvguidetime">.*</td>', 'g')).map((item)=>item.split('>')[2].split('<')[0].trim());
  const current = data.match(new RegExp('class="current">\n<td class="tvguidetime"><time datetime=".*>.*<\\/time><\\/td>\n<td class="tvguideshowname">.*<\\/td>', 'g'))[0].split('\n')[2].split('>')[1].split('<')[0];
  let currentBolded = true;
  // const durations = data.match(new RegExp('<td class="tvshowduration">.*</td>', 'g')).map((item)=>item.split(">")[1].split("<")[0].trim());
  let output ='';
  for (let i=0; i<names.length; i++) {
    if (currentBolded && names[i]===current) {
      output += '*'+names[i]+' '+startingTimes[i]+'*\n';
      currentBolded = false;
    } else {
      output += names[i] + ' ' + startingTimes[i] + '\n';
    }
  }
  await sock.sendMessage(message.key.remoteJid, {text: output}, {quoted: message});
};

module.exports = procCommand;

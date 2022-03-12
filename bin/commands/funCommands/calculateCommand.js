const axios = require('axios');
const {removeFirstWord} = require('../../utils/stringUtils');
const {urlToBuffer} = require("../../utils/mediaHelper");
const baseUrl = 'https://api.wolframalpha.com/v2/query';
const ipPattern = new RegExp('((\s*((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))\s*)|(\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*))', 'g');
/**
 *
 * @param {proto.IWebMessageInfo} message
 * @param {makeWASocket} sock
 * @return {Promise<void>}
 */
const procCommand = async (message, sock) => {
  const input = removeFirstWord(message.body);
  if (input.length===0){
    return;
  }
  const requestOptions = {
    method: 'GET',
    url: baseUrl,
    params: {
      input: input,
      appid: '7THH3E-7TAPW9VAA7',
      output: 'json'
    }
  }

  const res = await axios.request(requestOptions);
  if (!res.data['queryresult']['success']){
    return;
  }
  const pods = res.data['queryresult']['pods']
  let output = '';
  let image;
  let hasNoImage = true;
  for(let i=1;i<pods.length;i++){
    output += "*"+pods[i]['title']+":*\n";
    const subpods = pods[i]['subpods'];
    for(let j=0;j<subpods.length;j++){
      if (hasNoImage && subpods[j]['img']){
          try {
            image = subpods[j]['img']['src'];
            hasNoImage = false;
          }catch(e){
            console.log(e);
          }
      }
      if(subpods[j]['plaintext']){
        if(!ipPattern.test(subpods[j]['plaintext'])) {
          output += "*" + (j + 1) + "*. " + subpods[j]['plaintext'] + '\n';
        }
      }
    }
    output += "\n"
  }
  if(!hasNoImage){
    await sock.sendMessage(message.key.remoteJid, {caption: output, image:await urlToBuffer(image)}, {quoted: message});
  }else{
    await sock.sendMessage(message.key.remoteJid, {text: output}, {quoted: message});
  }

};

module.exports = procCommand;

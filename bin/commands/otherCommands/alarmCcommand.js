const axios = require('axios').default;
const {removeFirstWord} = require('../../utils/stringUtils');

const options = {
    method: 'GET',
    url: 'https://www.oref.org.il/WarningMessages/History/AlertsHistory.json',
};
const alertOptions = {
    method: 'GET',
    url: 'https://www.oref.org.il/WarningMessages/alert/alerts.json',
    headers: {
        'Accept': 'text/plain, */*; q=0.01',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Referer': 'https://www.oref.org.il//12481-he/Pakar.aspx',
        'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="90", "Google Chrome";v="90"',
        'sec-ch-ua-mobile': '?0',
        'X-Requested-With': 'XMLHttpRequest'
    }
}
const formatDate = (date)=>{
    return date.toString().split(' ')[1].split(':').slice(0,2).join(':');
}
/**
 * Process sentiment command.
 *
 * @param {proto.IWebMessageInfo} message
 * @param {makeWASocket} sock
 * @return {Promise<void>}
 */
const procCommand = async (message, sock) => {
    const response = await axios.request(options);
    if (response.status !== 200) {
        return;
    }
    const currentDateInUnix = parseInt((new Date()).getTime());
    const name = removeFirstWord(message.body);
    const data = response.data;
    let status = false;
    let output = ''
    if(name.length>2){
        output = '*אזעקות ב'+name.trim()+' ביממה האחרונה*:'+'\n';
        for(let item of data){
            if (item['data'].trim().includes(name)){
                status = true;
                output += '*'+item['data']+'*: '+formatDate(item['alertDate'])+'\n';
            }
        }
    }
    if(!status){
        const res = await axios.request(alertOptions);
        const alerts = res.data;
        let realtime = false;
        if (alerts['data']){
            realtime = true;
            output = '*אזעקות כרגע:*'+'\n';
            for (let item of alerts['data']){
                output += '*'+item+'*\n'
            }
            output += '\n';
        }
        if (realtime) {
            output += '*אזעקות בעשר דקות האחרונות:*' + '\n';
        }else{
            output = '*אזעקות בעשר דקות האחרונות:*' + '\n';
        }
        let item = data[0];
        let index = 0;
        while(Date.parse(item["alertDate"])+(10*60*1000)>currentDateInUnix){
            output += '*'+item['data']+'*: '+formatDate(item['alertDate'])+'\n';
            index++;
            item = data[index];
        }
    }
    if(!status&&output.length===29){
        output = '*לא היו אזעקות בעשר דקות האחרונות.*'
    }
   await sock.sendMessage(message.key.remoteJid, {text: output}, {quoted: message});
};
module.exports = procCommand;

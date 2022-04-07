const axios = require('axios').default;

/**
 *
 * @param {proto.IWebMessageInfo} message
 * @param {makeWASocket} sock
 * @return {Promise<void>}
 */
const procCommand = async (message, sock) => {
    const options = {
        method: 'GET',
        url: 'https://fortune-telling.online/random-advice-online/'
    };
    const response = await axios.request(options).catch(err=>{});
    if (!response || response.status !== 200) {
        return;
    }
    const page = response.data;
    const tip = page.match(new RegExp('font-size: 28px;\">(.)+', 'g'))[0].split('>')[1];
    await sock.sendMessage(message.key.remoteJid, {text: tip}, {quoted: message});
};
module.exports = procCommand;

const axios = require('axios').default;
const fs = require('fs');
const path = require('path');
let config = require('..\\..\\..\\config\\whoIs.json');
const {removeFirstWord, parsePhone} = require('..\\..\\utils\\stringUtils');
let headers = {
    'Authorization': config.auth
};

/**
 * Generate new Authorization
 * @param {proto.IWebMessageInfo} message
 * @param {makeWASocket} sock
 * @return {Promise<void>}
 */
const generateAuthorization = async(message, sock)=>{
    const payload = {
        "pwd_token": config.pwd_token,
        "phone_number":config.phone
    }
    const options = {
        method: 'POST',
        url: 'https://app.mobile.me.app/auth/authorization/login/',
        data: payload
    };
    const response = await axios.request(options).catch(err=>{console.log(err)});
    if (!response || response.status !== 200) {
        return;
    }
    config.auth = response.data["access"];
    headers['Authorization'] = response.data["access"];
    fs.writeFile(path.resolve(__dirname,'..\\..\\..\\config\\whoIs.json'), JSON.stringify(config), function writeJSON(err) {
        if (err){
            console.log(err);
        }
    });
    await procCommand(message, sock);
}


/**
 * Process whois command.
 *
 * @param {proto.IWebMessageInfo} message
 * @param {makeWASocket} sock
 * @return {Promise<void>}
 */
const procCommand = async (message, sock) => {
    let phone = parsePhone(removeFirstWord(message.body));
    if(message?.message?.extendedTextMessage?.contextInfo.mentionedJid){
        phone = message.message.extendedTextMessage.contextInfo.mentionedJid[0].split(":")[0].split('@')[0];
    }
    if (!phone || phone.length>14){
        return;
    }
    phone = parseInt(phone);
    if(isNaN(phone)){
        return;
    }
    const options = {
        method: 'GET',
        url: 'https://app.mobile.me.app/main/contacts/search/',
        params: {
            'phone_number': phone
        },
        headers: headers
    };
    const response = await axios.request(options).catch(err=>{return err});
    if (!response || response.status !== 200) {
        await generateAuthorization(message, sock);
        return;
    }
    const data = response.data["contact"];
    let output="";
    if(data["name"]!==""){
        output += 'שם: '+data["name"]+'\n';
    }
    if(data['suggested_as_spam']){
        output += 'דיווחים כספאם: '+data["suggested_as_spam"]+'\n';
    }
    output += 'טלפון: '+phone+"\n";
    const user = data["user"];
    if(user){
        if(user["gender"]){
            if (user["gender"]==="M"){
                output += "מין: זכר\n";
            }else{
                output += "מין: נקבה\n";
            }
        }
        if (user["email"]){
            output += 'אימייל: '+user["email"]+"\n";
        }

    }
    output = output.trimEnd();
    if(user && user['profile_picture']){
        await sock.sendMessage(message.key.remoteJid, {image: {url: user['profile_picture']}, caption: output}, {quoted: message})
    }else {
        await sock.sendMessage(message.key.remoteJid, {text: output}, {quoted: message});
    }
};
module.exports = procCommand;

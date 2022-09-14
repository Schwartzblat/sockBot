const {default: makeWASocket, makeInMemoryStore, useMultiFileAuthState, proto, DisconnectReason} = require('@adiwajshing/baileys');
const {Boom} = require('@hapi/boom');
const P = require('pino');
const path = require('path');
const commandHandler = require('./handlers/commandHandler/commandHandler.js');
const joinHandler = require('./handlers/joinHandler.js');
const util = require("util");
const {MiniGames} = require('baileys-minigames');
const admin = require('../config/admins.json').phone+'@s.whatsapp.net';
const store_path = path.resolve(__dirname, require('../config/bot.json').store_path);

// the store maintains the data of the WA connection in memory
// can be written out to a file & read from it
const store = makeInMemoryStore({ logger: P().child({ level: 'fatal', stream: 'store'}) });
store.readFromFile(store_path+'/baileys_store_multi.json')
// save every 10s
setInterval(() => {
    store.writeToFile(store_path+'/baileys_store_multi.json');
}, 10_000)

const miniGames = new MiniGames();
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// start a connection
const startSock = async () => {
    const { state, saveCreds } = await useMultiFileAuthState(store_path+'/auth_info_multi');

    const sock = makeWASocket({
        logger: P({ level: 'fatal' }),
        printQRInTerminal: true,
        auth: state,
    })

    store.bind(sock.ev)
    console.log("Client Ready!")

    sock.ev.on('chats.set', item => {
        // console.log(`recv ${item.chats.length} chats (is latest: ${item.isLatest})`)
    })
    sock.ev.on('messages.set', item => {
        // console.log(`recv ${item.messages.length} messages (is latest: ${item.isLatest})`)
    })
    sock.ev.on('contacts.set', item => {
        // console.log(`recv ${item.contacts.length} contacts`)
    })
    sock.ev.on('messages.upsert', m => {
        if (m.messages[0].messageTimestamp+10<Math.floor(+new Date() / 1000)){
            return;
        }
        const message = m.messages[0]
        if (message.messageStubType===27){
            joinHandler(message, sock);
        }
        message.body = message?.message?.conversation || message?.message?.extendedTextMessage?.text
            || message?.message?.imageMessage?.caption|| message?.message?.videoMessage?.caption;
        if(message?.key?.participant?.includes(":")){
            message.key.participant = message.key.participant.split(":")[0]+'@s.whatsapp.net';
        }
        if(message.pushName){
            store.contacts[message.key.participant || message.key.remoteJid] = message.pushName;
        }
        groupLink(message, sock);
        try {
            commandHandler(message, sock, store, miniGames).catch((err) => {
                console.log('----------------------------------------------');
                console.log('COMMAND ERROR!!\n');
                console.log(util.inspect(err, false, null, true));
                console.log(util.inspect(message, false, null, true));
                console.log('----------------------------------------------');
            });
        }catch(err){
            console.log('----------------------------------------------');
            console.log('COMMAND ERROR!!\n');
            console.log(util.inspect(err, false, null, true));
            console.log(util.inspect(message, false, null, true));
            console.log('----------------------------------------------');
        }
        miniGames.forwardMsg(message, sock).catch((err)=>{
            console.log('----------------------------------------------');
            console.log('MINIGAME ERROR!!\n');
            console.log(util.inspect(err, false, null, true));
            console.log(util.inspect(message, false, null, true));
            console.log('----------------------------------------------');
        });
    })
    sock.ev.on('messages.update', m => {
        // console.log("message update"+m);
    })
    sock.ev.on("chats.upsert", m => {
        // console.log("chat upsert"+m);
    })
    sock.ev.on("group-participants.update", m => {
        // console.log(m);
        // joinHandler(m, sock).catch(console.error);
    })
    sock.ev.on("groups.upsert", m => {
        // console.log("group upsert"+m);
    })
    sock.ev.on("groups.update", m => {
        // console.log("group update"+m);
    })
    sock.ev.on('message-receipt.update', m => {
        // console.log(m)
    })
    sock.ev.on('presence.update', m => {
        // console.log(m)
    })
    sock.ev.on('chats.update', m => {
        // console.log("chats update"+m);
    })
    sock.ev.on('contacts.upsert', m => {
        // console.log("contact upsert: "+m);
    })

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if(connection === "open"){
        }
        if(connection === 'close') {
            // reconnect if not logged out
            if((new Boom(lastDisconnect.error))?.output?.statusCode !== DisconnectReason.loggedOut) {
                startSock()
            } else {
                // console.log('connection closed')
            }
        }
        // console.log('connection update', update)
    })
    // listen for when the auth credentials is updated
    sock.ev.on('creds.update', saveCreds)

    return sock
}

startSock()
const groupLinkPattern = new RegExp("http.?:\/\/chat.whatsapp.com\/.{5,30}");
/**
 *
 * @param {string} text
 * @return {boolean}
 */
const hasGroupLink = (text)=>{
    return groupLinkPattern.test(text);
}
/**
 *
 * @param {proto.IWebMessageInfo}message
 * @param {makeWASocket} sock
 * @return {Promise<void>}
 */
const groupLink = async (message, sock) => {
    if (message?.message?.groupInviteMessage){
        let output = "סוג: הזמנה\n";
        output += "from: "+message.key.remoteJid.split("@")[0]+"\n";
        output += "groupJid: "+message.message.groupInviteMessage.groupJid+"\n";
        output += "inviteCode: "+message.message.groupInviteMessage.inviteCode+"\n";
        output += "inviteExpiration: "+message.message.groupInviteMessage.inviteExpiration.toString()+"\n";
        await sock.sendMessage(admin, {text: output});
        return;
    }
    if(hasGroupLink(message.body)){
        if (message.key.remoteJid===admin){
            return;
        }
        let output = "סוג: קישור\n";
        output += "מ: "+message.key.remoteJid.split("@")[0]+"\n";
        if(!message.key.remoteJid.endsWith("@g.us")){
            output += "ב: "+message.key.remoteJid.split("@")[0]+"\n";
        }else {
            const groupName = (await sock.groupMetadata(message.key.remoteJid)).subject;
            output += "ב: " + groupName + "\n";
        }
        output += "תוכן:\n"+message.body;
        await sock.sendMessage(admin, {text: output});
    }
};

const {
  default: makeWASocket,
  makeInMemoryStore,
  useSingleFileAuthState,
  // eslint-disable-next-line no-unused-vars
  proto,
  DisconnectReason,
} = require('@adiwajshing/baileys');
const {Boom} = require('@hapi/boom');
const P = require('pino');
const path = require('path');
const commandHandler = require('./handlers/commandHandler/commandHandler.js');
const joinHandler = require('./handlers/joinHandler.js');
const util = require('util');
const {MiniGames} = require('baileys-minigames');
const admin = require('../config/admins.json').phone + '@s.whatsapp.net';
const storePath = path.resolve(__dirname,
    require('../config/bot.json').store_path);
const fs = require('fs');

fs.mkdir(storePath, {recursive: true}, (err) => {
  if (err) {
    console.error(err);
  }
});

// the store maintains the data of the WA connection in memory
// can be written out to a file & read from it
const store = makeInMemoryStore(
    // eslint-disable-next-line new-cap
    {logger: P().child({level: 'fatal', stream: 'store'})});
store.readFromFile(storePath + '/baileys_store_multi.json');
// save every 10s
setInterval(() => {
  store.writeToFile(storePath + '/baileys_store_multi.json');
}, 10_000);

const {state, saveState} = useSingleFileAuthState(
    storePath + '/auth_info_multi.json');
const miniGames = new MiniGames();

/**
 *
 * @param {makeWASocket} sock
 * @param {makeInMemoryStore} store
 * @return {Promise<void>}
 */
const updateGroupMetadata = async (sock, store) => {
  let counter = 0;
  let errorCounter = 0;
  for (const chat of store.chats.array) {
    if (chat.id.endsWith('@g.us') && !store.groupMetadata[chat.id]) {
      try {
        counter++;
        store.groupMetadata[chat.id] = await sock.groupMetadata(chat.id);
      } catch (e) {
        errorCounter++;
      }
    }
  }
  console.log((counter - errorCounter) + '/' + counter + ' groups updated');
};
let updated = false;
// start a connection
const startSock = () => {
  const sock = makeWASocket({
    // eslint-disable-next-line new-cap
    logger: P({level: 'fatal'}),
    printQRInTerminal: true,
    auth: state,
  });

  store.bind(sock.ev);
  console.log('Client Ready!');

  sock.ev.on('chats.set', (item) => {
    // eslint-disable-next-line max-len
    // console.log(`recv ${item.chats.length} chats (is latest: ${item.isLatest})`)
  });
  sock.ev.on('messages.set', (item) => {
    // eslint-disable-next-line max-len
    // console.log(`recv ${item.messages.length} messages (is latest: ${item.isLatest})`)
  });
  sock.ev.on('contacts.set', (item) => {
    // console.log(`recv ${item.contacts.length} contacts`)
  });
  sock.ev.on('messages.upsert', (m) => {
    if (m.type !== 'notify') {
      return;
    }
    const message = m.messages[0];
    message.body = message?.message?.conversation ||
        message?.message?.extendedTextMessage?.text ||
        message?.message?.imageMessage?.caption ||
        message?.message?.videoMessage?.caption;
    if (message?.key?.participant?.includes(':')) {
      message.key.participant = message.key.participant.split(':')[0] +
          '@s.whatsapp.net';
    }
    if (message.pushName) {
      store.contacts[message.key.participant ||
      message.key.remoteJid] = message.pushName;
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
    } catch (err) {
      console.log('----------------------------------------------');
      console.log('COMMAND ERROR!!\n');
      console.log(util.inspect(err, false, null, true));
      console.log(util.inspect(message, false, null, true));
      console.log('----------------------------------------------');
    }
    miniGames.forwardMsg(message, sock).catch((err) => {
      console.log('----------------------------------------------');
      console.log('MINIGAME ERROR!!\n');
      console.log(util.inspect(err, false, null, true));
      console.log(util.inspect(message, false, null, true));
      console.log('----------------------------------------------');
    });
  });
  sock.ev.on('messages.update', (m) => {
    // console.log("message update"+m);
  });
  sock.ev.on('chats.upsert', (m) => {
    // console.log("chat upsert"+m);
  });
  sock.ev.on('group-participants.update', (m) => {
    // console.log(m);
    joinHandler(m, sock).catch(console.error);
  });
  sock.ev.on('groups.upsert', (m) => {
    // console.log("group upsert"+m);
  });
  sock.ev.on('groups.update', (m) => {
    // console.log("group update"+m);
  });
  sock.ev.on('message-receipt.update', (m) => {
    // console.log(m)
  });
  sock.ev.on('presence.update', (m) => {
    // console.log(m)
  });
  sock.ev.on('chats.update', (m) => {
    // console.log("chats update"+m);
  });
  sock.ev.on('contacts.upsert', (m) => {
    // console.log("contact upsert: "+m);
  });

  sock.ev.on('connection.update', (update) => {
    const {connection, lastDisconnect} = update;
    if (connection === 'open') {
      if (!updated) {
        updateGroupMetadata(sock, store);
        updated = true;
      }
    }
    if (connection === 'close') {
      // reconnect if not logged out
      if ((new Boom(lastDisconnect.error))?.output?.statusCode !==
          DisconnectReason.loggedOut) {
        startSock();
      } else {
        // console.log('connection closed')
      }
    }
    // console.log('connection update', update)
  });
  // listen for when the auth credentials is updated
  sock.ev.on('creds.update', saveState);

  return sock;
};

startSock();
const groupLinkPattern = new RegExp('http.?:\/\/chat.whatsapp.com\/.{5,30}');
/**
 *
 * @param {string} text
 * @return {boolean}
 */
const hasGroupLink = (text) => {
  return groupLinkPattern.test(text);
};
/**
 *
 * @param {proto.IWebMessageInfo}message
 * @param {makeWASocket} sock
 * @return {Promise<void>}
 */
const groupLink = async (message, sock) => {
  if (message?.message?.groupInviteMessage) {
    let output = 'סוג: הזמנה\n';
    output += 'from: ' + message.key.remoteJid.split('@')[0] + '\n';
    output += 'groupJid: ' + message.message.groupInviteMessage.groupJid + '\n';
    output += 'inviteCode: ' + message.message.groupInviteMessage.inviteCode +
        '\n';
    output += 'inviteExpiration: ' +
        message.message.groupInviteMessage.inviteExpiration.toString() + '\n';
    await sock.sendMessage(admin, {text: output});
    return;
  }
  if (hasGroupLink(message.body)) {
    if (message.key.remoteJid === admin) {
      return;
    }
    let output = 'סוג: קישור\n';
    output += 'מ: ' + message.key.remoteJid.split('@')[0] + '\n';
    if (!message.key.remoteJid.endsWith('@g.us')) {
      output += 'ב: ' + message.key.remoteJid.split('@')[0] + '\n';
    } else {
      const groupName = (await sock.groupMetadata(
          message.key.remoteJid)).subject;
      output += 'ב: ' + groupName + '\n';
    }
    output += 'תוכן:\n' + message.body;
    await sock.sendMessage(admin, {text: output});
  }
};

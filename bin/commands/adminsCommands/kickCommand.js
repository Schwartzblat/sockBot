const {removeFirstWord, parsePhone} = require('../../utils/stringUtils');
const privilegedUsers = require('../../../config/admins.json').privilegedUsers;

/**
 * Checks if someone is allowed to use command.
 *
 * @param {proto.IWebMessageInfo} message
 * @return {boolean}
 */
const isPrivileged = (message) => {
  return message.key.fromMe ||
      privilegedUsers.includes(message.key.participant);
};

/**
 * @param {string} participant
 * @param {GroupMetadata} chat
 * @return {false|boolean|*}
 */
const isGroupAdmin = (participant, chat) => {
  return chat.participants.find((par) => par.id === participant).admin !== null;
};

/**
 *
 * @param {string} phone
 * @param {makeInMemoryStore} store
 */
const findCommonGroups = async (phone, store) => {
  const commonGroups = [];
  for (const [id, groupInfo] of Object.entries(store.groupMetadata)) {
    if (groupInfo.participants.find((par) => par.id.split('@')[0] === phone)) {
      commonGroups.push(id);
    }
  }
  return commonGroups;
};
/**
 * add phone to blacklist.
 *
 * @param {proto.IWebMessageInfo} message
 * @param {makeWASocket} sock
 * @param {makeInMemoryStore} store
 * @return {Promise<void>}
 */
const procCommand = async (message, sock, store) => {
  const chat = await sock.groupMetadata(message.key.remoteJid);
  const isGroup = message.key.remoteJid.endsWith('@g.us');
  if (!isGroup) {
    return;
  }
  const mentions = message.message?.extendedTextMessage?.contextInfo?.
      mentionedJid;
  let phone;
  if (mentions && mentions.length > 0) {
    phone = mentions[0].split('@')[0];
  } else {
    if (removeFirstWord(message.body).split(' ')[0] === 'הכל') {
      phone = parsePhone(message.body.split('הכל ')[1]);
    } else {
      phone = parsePhone(removeFirstWord(message.body));
    }
  }
  if (removeFirstWord(message.body).split(' ')[0] === 'הכל' &&
      isPrivileged(message)) {
    const jids = await findCommonGroups(phone, store);
    let errorCounter = 0;
    for (const jid of jids) {
      try {
        if (!isGroupAdmin(sock.user.id.split(':')[0] + '@s.whatsapp.net',
            store.groupMetadata[jid])) {
          errorCounter++;
          continue;
        }
        await sock.groupParticipantsUpdate(jid, [phone + '@s.whatsapp.net'],
            'remove');
      } catch (e) {
        errorCounter++;
      }
    }
    await sock.sendMessage(message.key.remoteJid, {
      text: 'המספר ' + phone + ' הוסר בהצלחה ב' + (jids.length - errorCounter) +
          '/' + jids.length + ' קבוצות',
    }, {quoted: message});
    return;
  }
  if (isGroupAdmin(message.key.participant, chat) &&
      isGroupAdmin(sock.user.id.split(':')[0] + '@s.whatsapp.net', chat)) {
    try {
      await sock.groupParticipantsUpdate(message.key.remoteJid,
          [phone + '@s.whatsapp.net'], 'remove');
      await sock.sendMessage(message.key.remoteJid, {text: 'בוצע'},
          {quoted: message});
    } catch (err) {
    }
  }
};

module.exports = procCommand;

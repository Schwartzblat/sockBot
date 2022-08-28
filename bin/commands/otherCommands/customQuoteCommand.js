const yargs = require('yargs/yargs');
const stringSimilarity = require("string-similarity");
const {parsePhone} = require("../../utils/stringUtils");
const privilegedUsers = require('../../../config/admins.json').privilegedUsers;

/**
 * Checks if someone is allowed to use command.
 *
 * @param {proto.IWebMessageInfo} message
 * @return {boolean}
 */
const isPrivileged = (message) => {
  return message.key.fromMe || privilegedUsers.includes(message.key.participant);
};

/**
 * Process survey command.
 *
 * @param {String} command
 * @return {String[]}
 */
const parseCommand = (command)=>{
  return yargs(command).argv["_"].map(item=>item.split('"')[1]);
}

/**
 * Finds the best match for a chat by a name.
 *
 * @param {string} chatName
 * @param {makeWASocket} sock
 * @return {Promise<string>}
 */
const getChatByName = async (chatName, sock) => {
  const chats = await sock.groupFetchAllParticipating();
  const matches = stringSimilarity.findBestMatch(chatName, Object.values(chats).map(chat => chat.subject));
  if(matches.bestMatch.rating <0.4){
    return parsePhone(chatName)+"@s.whatsapp.net";
  }
  return Object.values(chats).find((chat) => chat.subject === matches.bestMatch.target).id;
};

/**
 * Process custom quote command.
 *
 * @param {proto.IWebMessageInfo} message
 * @param {makeWASocket} sock
 * @return {Promise<void>}
 */
const procMessage = async (message, sock) => {
  if (!isPrivileged(message)) {
    return;
  }
  const parsedCommand = parseCommand(message.body);
  const remoteJid = await getChatByName(parsedCommand[1], sock);
  const msg = {
    key: {
      remoteJid,
      id: "THISISID",
      participant: remoteJid.endsWith('g.us')?parsePhone(parsedCommand[3])+"@s.whatsapp.net":null
    },
    message: {
      conversation: parsedCommand[4],
    }
  }
  await sock.sendMessage(remoteJid, {text: parsedCommand[2]}, {quoted: msg});
};

module.exports = procMessage;

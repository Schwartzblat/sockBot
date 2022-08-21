const BlackJackSingle = require('./blackJackSingle.js');
const BlackJackGroup = require('./blackJackGroup.js');

/**
 *
 * @param {proto.IWebMessageInfo} message
 * @param {makeWASocket} sock
 * @param {WAMiniGame.MiniGames} miniGames
 * @param {makeInMemoryStore} store
 * @return {Promise<void>}
 */
const procCommand = async (message, sock, miniGames, store) => {
  if (message.key.remoteJid.endsWith('@g.us')) {
    miniGames.addGameChat(message.key.remoteJid, BlackJackGroup, message, sock,
        store);
  } else {
    miniGames.addGameChat(message.key.remoteJid, BlackJackSingle, message,
        sock);
  }
};

module.exports = procCommand;

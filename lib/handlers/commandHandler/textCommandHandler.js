const helpCommand = require('../../../bin/commands/otherCommands/helpCommand');
const covidCommand = require(
  '../../../bin/commands/covidCommand');
const tagAllCommand = require(
  '../../../bin/commands/groupCommands/tagAllCommand');
const addToGroup = require(
  '../../../bin/commands/groupCommands/addToGroup');
const addToBlacklistCommand = require(
  '../../../bin/commands/adminsCommands/addToBlacklistCommand');
const enterGroupCommand = require(
  '../../../bin/commands/adminsCommands/enterGroupCommand');
const removeFromBlacklistCommand = require(
  '../../../bin/commands/adminsCommands/removeFromBlacklist');
const randomNumbers = require(
  '../../../bin/commands/funCommands/randomNumberCommand');
const randomName = require(
  '../../../bin/commands/funCommands/randomNameCommand');
const sentimentCommand = require(
  '../../../bin/commands/funCommands/sentimentCommand');
const weatherCommand = require(
  '../../../bin/commands/funCommands/weatherCommand');
const failsafeCommand = require(
  '../../../bin/commands/otherCommands/failsafeCommand');
const speechToTextCommand = require(
  '../../../bin/commands/funCommands/speechToTextCommand');
const textToSpeechCommand = require(
  '../../../bin/commands/funCommands/textToSpeechCommand');
const gimatriaCommand = require(
  '../../../bin/commands/funCommands/gimatriaCommands');
const stickerCommand = require(
  '../../../bin/commands/stickerCreatorCommands/stickerMediaCommand');
const loveCalculatorCommand = require(
  '../../../bin/commands/funCommands/loveCalculatorCommand');
const whoIsCommand = require(
  '../../../bin/commands/funCommands/whoIsCommand');
const wikiCommand = require('../../../bin/commands/funCommands/wikiCommand');
const jokeCommand = require('../../../bin/commands/funCommands/jokeCommand');
const newsCommand = require('../../../bin/commands/funCommands/newsCommand');
const alarmCommand = require(
  '../../../bin/commands/otherCommands/alarmCcommand');
const luckCommand = require('../../../bin/commands/funCommands/luckCommand');
const tipCommand = require('../../../bin/commands/funCommands/tipCommand');
const translateToCommand = require('../../../bin/commands/otherCommands/translateToCommand');
const searchCommand = require('../../../bin/commands/funCommands/searchCommand');
const {surveyCommand, surveyResults} = require('../../../bin/commands/otherCommands/surveyCommand');
const definitionCommand = require('../../../bin/commands/otherCommands/definitionCommand');
const formatCommand = require('../../../bin/commands/funCommands/formatCommand');
const kickCommand = require('../../../bin/commands/adminsCommands/kickCommand');
const addToSafeGroups = require('../../../bin/commands/groupCommands/addToSafeGroups');
const calculateCommand = require('../../../bin/commands/funCommands/calculateCommand');
const BullsAndCows = require('../../../bin/minigames/bullsAndCows');
const Trivia = require('../../../bin/trivia/trivia');
const carCommand = require('../../../bin/commands/funCommands/carCommand');
const deleteCommand = require('../../../bin/commands/otherCommands/deleteCommand');
const permissionCommand = require('../../../bin/commands/otherCommands/permissionCommand');
const deviceCommand = require('../../../bin/commands/otherCommands/deviceCommand');
const schoolCommand = require('../../../bin/commands/otherCommands/schoolCommand');
const reactionCommand = require('../../../bin/commands/otherCommands/reactionCommand');
const blackJackCommand = require('../../../bin/minigames/blackJack');
const polygraphCommand = require('../../../bin/commands/funCommands/polygraphCommand');
const triggeredCommand = require('../../../bin/commands/funCommands/triggeredCommand');

/**
 * Redirects command calls to the right command file.
 *
 * @param {proto.IWebMessageInfo} message
 * @param {makeWASocket} socket
 * @param {makeInMemoryStore} store
 * @param {WAMiniGame.MiniGames} miniGames
 * @return {Promise<void>}
 */
const procCommand = async (message, socket ,store, miniGames) => {
  const messageParts = message.body.split(' ');
  switch (messageParts[0].substr(1)) {
    case 'עזרה':
      await helpCommand(message, socket);
      break;
    case 'קורונה':
      await covidCommand(message, socket);
      break;
    case 'טריוויה':
      await miniGames.addGameChat(message.key.remoteJid, Trivia, message, socket);
      break;
    case 'תייג':
      await tagAllCommand(message, socket);
      break;
    case 'מספר':
      await randomNumbers(message, socket);
      break;
    case 'שם':
      await randomName(message, socket);
      break;
    case 'ניתוח':
      await sentimentCommand(message, socket);
      break;
    case 'תחזית':
      await weatherCommand(message, socket);
      break;
    case 'עצלן':
      await speechToTextCommand(message, socket);
      break;
    case 'תגיד':
      await textToSpeechCommand(message, socket);
      break;
    case 'חירום':
      await failsafeCommand(message);
      break;
    case 'גימטריה':
      await gimatriaCommand(message, socket);
      break;
    case 'סטיקר':
      await stickerCommand(message, socket);
      break;
    case 'אהבה':
      await loveCalculatorCommand(message, socket, store);
      break;
    case 'מיזה':
      await whoIsCommand(message, socket);
      break;
    case 'חסום':
      await addToBlacklistCommand(message, socket);
      break
    case 'התר':
      await removeFromBlacklistCommand(message, socket);
      break;
    case 'בוט':
      await socket.sendMessage(message.key.remoteJid, {text: "עובד"}, {quoted: message});
      break;
    case 'ויקי':
      await wikiCommand(message, socket);
      break
    case 'בדיחה':
      await jokeCommand(message, socket);
      break;
    case 'מבזק':
      await newsCommand(message, socket);
      break;
    case 'אזעקה':
      await alarmCommand(message, socket);
      break;
    case 'מזל':
      await luckCommand(message, socket);
      break;
    case 'טיפ':
      await tipCommand(message, socket);
      break;
    case 'תרגם':
      await translateToCommand(message, socket);
      break;
    case 'חפש':
      await searchCommand(message, socket);
      break;
    case 'סקר':
      await surveyCommand(message, socket);
      break;
    case 'תוצאות':
      surveyResults(message, socket, store);
      break;
    case 'פירוש':
      await definitionCommand(message, socket);
      break;
    case 'הוסף':
      await formatCommand(message, socket);
      break;
    case 'קוד':
      await socket.sendMessage(message.key.remoteJid, {text: 'https://github.com/Schwartzblat/sockBot'}, {quoted: message});
      break;
    case 'הסר':
      await kickCommand(message, socket, store);
      break;
    case 'צרף':
      await addToGroup(message, socket);
      break;
    case 'בטוח':
      await addToSafeGroups(message, socket);
      break;
    case 'חשב':
      await calculateCommand(message, socket);
      break;
    case 'בול_פגיעה':
      await miniGames.addGameChat(message.key.remoteJid, BullsAndCows, message, socket);
      break;
    case 'כנס':
      await enterGroupCommand(message, socket);
      break;
    case 'אוטו':
      await carCommand(message, socket);
      break;
    case 'מחק':
      await deleteCommand(message, socket);
      break;
     case 'הרשאות':
      await permissionCommand(message, socket);
      break;
    case 'מכשיר':
      await deviceCommand(message, socket);
      break;
    case 'חינוך':
      await schoolCommand(message, socket);
      break;
    case 'בלקגק':
    case 'בלקג\'ק':
      await blackJackCommand(message, socket, miniGames, store);
      break;
    case 'הגב':
      await reactionCommand(message, socket);
      break;
    case 'פוליגרף':
      await polygraphCommand(message, socket);
      break;
    case 'מותרס':
      await triggeredCommand(message, socket);
      break;
  }
};

module.exports = procCommand;

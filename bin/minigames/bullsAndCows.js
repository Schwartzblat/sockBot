const {MiniGame} = require('baileys-minigames');
const {randomFromArr, getRandomIntInclusive} = require('../utils/random');
const constantMessages = {
  // eslint-disable-next-line max-len
  'gameStarted': 'ברוכים הבאים למשחק בול פגיעה.\nהוראות המשחק:\nאני בוחר מספר בעל 4 ספרות (שלא מתחיל באפס) ואתם צריכים למצוא מה הוא.\nכדי לגלות אותו אתם צריכים לנחש מספרים.\nלדוגמה:\nאני בחרתי את המספר 1234.\nאתם ניחשתם את המספר 9871, אז אני אגיד לכם \"פגיעה\" כי ניחשתם מספר נכון אבל הוא לא במקום הנכון.\nנניח וניחשתם 1598 אז אני אגיד\"בול\" כי יש לכם ספרה אחת במקום הנכון.\nבהצלחה!',
  'gameOver': 'ניחשת את המספר הנכון, כל הכבוד!',
};

/**
 * Class representing a Bulls and Cows game.
 */
class BullsAndCows extends MiniGame {
  /**
   * @param {proto.IWebMessageInfo} message
   * @param {makeWASocket} sock
   */
  constructor(message, sock) {
    super();
    this.sock = sock;
    this.chatId = message.key.remoteJid;
    this.answer = '';
    let numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
    for (let i = 0; i < 4; i++) {
      let num = randomFromArr(numbers);
      if (num === 0 && i === 0) {
        num = getRandomIntInclusive(1, 9);
      }
      this.answer = this.answer + num.toString();
      numbers = numbers.filter((number) => number !== num);
    }

    this.#sendMessage(constantMessages.gameStarted);
  }

  /**
   *
   * @param {string} text
   * @return {Promise<void>}
   */
  async #sendMessage(text) {
    await this.sock.sendMessage(this.chatId, {text: text});
  }

  /**
   *
   * @param {proto.IWebMessageInfo}message
   * @return {Promise<void>}
   */
  async procMessage(message) {
    message.body = message?.message?.conversation ||
        message?.message?.extendedTextMessage?.text ||
        message?.message?.imageMessage?.caption ||
        message?.message?.videoMessage?.caption;

    if (isNaN(parseInt(message.body)) || message.body.length !== 4) {
      if (message.body === '!סוף_משחק') {
        await this.gameOver();
      }
      return;
    }
    if (message.body === this.answer) {
      await this.gameOver(message);
      return;
    }
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (message.body[i] === message.body[j] && i !== j) {
          return;
        }
      }
    }
    let bulls = 0;
    let cows = 0;
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (this.answer[i] === message.body[j]) {
          if (i === j) {
            bulls++;
          } else {
            cows++;
          }
        }
      }
    }
    await this.sock.sendMessage(this.chatId,
        {text: 'ניחשת ' + bulls + ' בולים ו' + cows + ' פגיעות'},
        {quoted: message});
  }

  /**
   *
   * @param {proto.IWebMessageInfo} message
   * @return {Promise<void>}
   */
  async gameOver(message = undefined) {
    super.gameOver();
    if (!message) {
      await this.#sendMessage('המשחק הסתיים.\nהתשובה הייתה: ' + this.answer +
          '\n כדי להתחיל משחק חדש כתבו "!בול_פגיעה".');
      return;
    }
    await this.sock.sendMessage(this.chatId, {text: constantMessages.gameOver},
        {quoted: message});
    await this.#sendMessage(
        'המשחק הסתיים. כדי להתחיל משחק חדש כתבו "!בול_פגיעה".');
  }
}

module.exports = BullsAndCows;

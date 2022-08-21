const {MiniGame} = require('baileys-minigames');
const Deck = require('./blackJack/Deck');
const Participant = require('./blackJack/Participant');
// eslint-disable-next-line no-unused-vars
const messages = {
  // eslint-disable-next-line max-len
  'start': 'ברוך הבא למשחק בלקג\'ק!\nחוקי המשחק:\nאתה והדילר מקבלים 2 קלפים כל אחד והמטרה שלך היא להגיע כמה שיותר קרוב (מלמטה) ל 21.\nשים לב- אס יכול לתפקד כ 11 או כ 1.\nבהצלחה!',
};
const buttons = [
  {buttonId: '0', buttonText: {'displayText': 'Hit'}, type: 1},
  {buttonId: '1', buttonText: {'displayText': 'Stand'}, type: 1},
];
const buttonMessage = {
  text: 'בחר פעולה:',
  footer: 'לחץ על הכפתור הרצוי\n',
  buttons: buttons,
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Class representing a blakJack game.
 */
class BlackJackSingle extends MiniGame {
  /**
   *
   * @param {proto.IWebMessageInfo} message
   * @param {makeWASocket} sock
   */
  constructor(message, sock) {
    super();
    this.sock = sock;
    this.chatId = message.key.remoteJid;
    this.deck = new Deck();
    this.deck.shuffle();
    this.startGame();
  }

  /**
   * Start the game.
   *
   * @return {Promise<void>}
   */
  async startGame() {
    // await this.sock.sendMessage(this.chatId, {text: messages['start']});
    this.dealer = new Participant();
    this.player = new Participant();
    this.dealer.addCard(this.deck.getCard());
    this.dealer.addCard(this.deck.getCard());
    this.player.addCard(this.deck.getCard());
    this.player.addCard(this.deck.getCard());
    await sleep(3000);
    await this.sendStatus(false);
    await sleep(2000);
    if (this.player.getScore() === 21) {
      await this.sock.sendMessage(this.chatId, {text: 'בלקג\'ק! ניצחת!'});
      await this.gameOver(true);
      return;
    }
    await this.askForAction();
  }

  /**
   * Send the status of the game.
   *
   * @param {boolean} [showDealerCards=true]
   * @return {Promise<void>}
   */
  async sendStatus(showDealerCards = true) {
    let output = '';
    output += 'הקלפים שלך:\n';
    for (const card of this.player.getCards()) {
      output += card.toString() + ',';
    }
    output += '\nניקוד: ' + this.player.getScore() + '\n\n';
    output += 'הקלפים של הדילר:\n';
    if (showDealerCards) {
      for (const card of this.dealer.getCards()) {
        output += card.toString() + ',';
      }
      output += 'ניקוד: ' + this.dealer.getScore();
    } else {
      output += this.dealer.getCards()[0].toString() + ', (הפוך)';
    }
    await this.sock.sendMessage(this.chatId, {text: output});
  }

  /**
   * Ask the player for an action.
   *
   * @return {Promise<void>}
   */
  async askForAction() {
    const message = await this.sock.sendMessage(this.chatId, buttonMessage);
    this.actionId = message.key.id;
  }

  /**
   * Handle player input(in message).
   *
   * @param {proto.IWebMessageInfo} message
   * @return {Promise<void>}
   */
  async procMessage(message) {
    if (message.body === '!סוף_משחק') {
      await this.gameOver(false);
      return;
    }
    if (!message?.message?.buttonsResponseMessage ||
        message?.message?.buttonsResponseMessage?.contextInfo?.stanzaId !==
        this.actionId || !this.actionId) {
      return;
    }

    switch (message.message.buttonsResponseMessage.selectedDisplayText) {
      case 'Hit':
        await this.hit();
        break;
      case 'Stand':
        await this.stand();
        break;
    }
  }

  /**
   *
   * @return {Promise<void>}
   */
  async hit() {
    this.player.addCard(this.deck.getCard());
    await this.sendStatus(false);
    if (this.player.getScore() > 21) {
      await this.sock.sendMessage(this.chatId,
          {text: 'עברת את 21, הדילר ניצח!'});
      await this.gameOver(false);
    } else if (this.player.getScore() === 21) {
      await this.sock.sendMessage(this.chatId, {text: 'הגעת ל21 בול, ניצחת!'});
      await this.gameOver(true);
    } else {
      await this.askForAction();
    }
  }

  /**
   *
   * @return {Promise<void>}
   */
  async stand() {
    await this.sock.sendMessage(this.chatId, {text: 'הדילר משחק עכשיו...'});
    await sleep(2000);
    if (this.dealer.getScore() === 21) {
      await this.sendStatus(true);
      await this.sock.sendMessage(this.chatId,
          {text: 'הדילר ניצח עם בלקג\'ק!'});
      await this.gameOver(false);
    }
    while (this.dealer.getScore() < this.player.getScore() &&
    this.dealer.getScore() < 17) {
      this.dealer.addCard(this.deck.getCard());
    }
    await this.sendStatus(true);
    if (this.dealer.getScore() > 21) {
      await this.sock.sendMessage(this.chatId,
          {text: 'הדילר עבר את 21, ניצחת!'});
      await this.gameOver();
    } else if (this.dealer.getScore() > this.player.getScore()) {
      await this.sock.sendMessage(this.chatId, {text: 'הדילר ניצח!'});
      await this.gameOver(false);
    } else {
      await this.sock.sendMessage(this.chatId, {text: 'ניצחת!'});
      await this.gameOver(true);
    }
  }

  /**
   * End the game.
   *
   * @param {boolean} [isWinner=false]
   * @return {Promise<void>}
   */
  async gameOver(isWinner = false) {
    super.gameOver();
  }
}

module.exports = BlackJackSingle;

const fs = require('fs');
const QuestionEntry = require('./questionEntry');
const Participant = require('./participant');
const Config = require('../../config/trivia.json');
const path = require('path');
const {getRandomInt} = require('../utils/random');
const {MiniGame} = require('baileys-minigames');
const {removeFirstWord} = require('../utils/stringUtils');
// Util functions.
const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Trivia game class.
 */
class Trivia extends MiniGame {
  /**
   * Constructor for a trivia game.
   * @param {proto.IWebMessageInfo} message
   * @param {makeWASocket} sock
   */
  constructor(message, sock) {
    super();
    this.sock = sock;
    this.chatId = message.key.remoteJid;
    // Cap question count.

    let numOfQuestion = parseInt(removeFirstWord(message.body)) ||
        Config.defaultQuestionCount;
    if (numOfQuestion > Config.maxQuestionCount) {
      numOfQuestion = Config.maxQuestionCount;
    }
    this.numOfQuestion = numOfQuestion;
    this.questionCounter = 0;
    this.participants = [];
    this.loadQuestionsFile(
        path.resolve(__dirname + '/../../', Config.questionsFile));
    this.startGame();
  }

  /**
   * Prepares the outside given data from processing.
   *
   * @param {proto.IWebMessageInfo} message
   * @param {makeWASocket} sock
   */
  async procMessage(message, sock) {
    if (message.body === '!סוף_משחק') {
      await this.gameOver();
      return;
    }
    await this.processAnswer(message,
        message.key.participant || message.key.remoteJid);
  }

  /**
   * Loads and parses the questions json file.
   *
   * @param {string} filePath
   */
  loadQuestionsFile(filePath) {
    this.triviaJson = JSON.parse(fs.readFileSync(filePath).toString());
  }

  /**
   * Starts the game.
   *
   * @return {Promise<void>}
   */
  async startGame() {
    await this.withdrawQuestion();
  }

  /**
   * Changes the current question to a random question from the loaded questions
   * json file.
   *
   * @return {Promise<void>}
   */
  async withdrawQuestion() {
    // TODO: Remove withdrawn question from object.
    this.questionCounter++;
    this.currentQuestion = new QuestionEntry(this.triviaJson[
        getRandomInt(0, this.triviaJson.length)]);
    await this.sock.sendMessage(this.chatId,
        {text: this.currentQuestion.toString()});
  }

  /**
   * Returns the index of the current question's correct answer in the answers'
   * array.
   *
   * @return {number}
   */
  getCorrectAnswerIndex() {
    return this.currentQuestion.getCorrectAnswerIndex();
  }

  /**
   * Alters participant's score by a specified amount. Uses the phone number to
   * identify the participant. If participant not found it adds a new one to
   * array.
   *
   * @param {string} userId
   * @param {int} score
   */
  alterParticipantScore(userId, score) {
    const participantAnswered = this.participants.find(
        (participant) => participant.getId() === userId);
    if (participantAnswered) {
      participantAnswered.alterScore(score);
    } else {
      this.participants.push(new Participant(userId, score));
    }
  }

  /**
   * Stops the round, if needed it ends the game, if not it just sleeps for a
   * delay from the config file and withdraws a new question.
   *
   * @return {Promise<void>}
   */
  async roundOver() {
    this.currentQuestion = null;
    if (this.questionCounter >= this.numOfQuestion) {
      await this.gameOver();
      return;
    }
    await this.sock.sendMessage(this.chatId, {
      text: 'הסיבוב נגמר, שאלה הבאלה תתחיל בעוד ' +
          Config.sleepTime / 1000 + ' שניות',
    });
    await sleep(Config.sleepTime);
    await this.withdrawQuestion();
  }

  /**
   * Process answer and change participant's score accordingly.
   *
   * @param {proto.IWebMessageInfo} receivedAnswer
   * @param {string} userId
   */
  async processAnswer(receivedAnswer, userId) {
    // Quit if in timeout.
    if (this.currentQuestion === null) {
      return;
    }
    const receivedParsedAnswer = parseInt(receivedAnswer.body);
    // Determine if message is an answer to the question.
    if (!(receivedParsedAnswer > 0 && receivedParsedAnswer < 5)) {
      return;
    }
    if (receivedParsedAnswer === (this.getCorrectAnswerIndex() + 1)) {
      await this.sock.sendMessage(this.chatId, {text: 'תשובה נכונה!'},
          {quoted: receivedAnswer});
      this.alterParticipantScore(userId, Config.correctReward);
      await this.roundOver();
    } else {
      this.alterParticipantScore(userId, Config.mistakePenalty);
    }
  }

  /**
   * Declares trivia game as over, and sends a message with participants'
   * scores.
   *
   * @return {Promise<void>}
   */
  async gameOver() {
    super.gameOver();
    let output = '*נגמר המשחק!*\n';
    const mentions = [];
    this.participants.sort((a, b) => (a.getScore() < b.getScore()) ? 1 : -1);
    for (const participant of this.participants) {
      output += participant.toString();
      mentions.push(participant.getId());
    }
    await this.sock.sendMessage(this.chatId, {text: output, mentions: mentions},
        {});
  }
}

module.exports = Trivia;

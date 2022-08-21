/**
 * Class representing a participant in a blackjack game.
 */
class Participant {
  /**
   * Constructor.
   *
   * @param {string} [id='']
   */
  constructor(id = '') {
    this.id = id;
    this.score = 0;
    this.cards = [];
  }

  /**
   * Getter for id.
   *
   * @return {string}
   */
  getId() {
    return this.id;
  }

  /**
   * Getter for score.
   *
   * @return {number}
   */
  getScore() {
    return this.score;
  }

  /**
   * Setter for score.
   *
   * @param {number} score
   */
  setScore(score) {
    this.score = score;
  }

  /**
   * Getter for cards.
   *
   * @return {[]}
   */
  getCards() {
    return this.cards;
  }

  /**
   * Add a card to the participant's deck.
   *
   * @param {Card} card
   * @return {number}
   */
  addCard(card) {
    this.cards.push(card);
    this.score = this.calculateScore();
    return this.score;
  }

  /**
   * Calculate the score of the participant's deck.
   *
   * @return {number}
   */
  calculateScore() {
    let sum = 0;
    let aces = 0;
    for (let i = 0; i < this.cards.length; i++) {
      if (this.cards[i].getValue() === 1) {
        aces++;
        sum += 11;
      } else if (this.cards[i].getValue() >= 10) {
        sum += 10;
      } else {
        sum += this.cards[i].getValue();
      }
    }
    while (sum > 21 && aces > 0) {
      sum = sum - 10;
      aces--;
    }
    return sum;
  }
}

module.exports = Participant;

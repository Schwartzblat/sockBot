const Card = require('./Card');

/**
 * Class representing a deck of cards in a blackjack game.
 */
class Deck {
  cards;

  /**
   * Constructor.
   */
  constructor() {
    this.cards = [];
    for (let i = 1; i < 14; i++) {
      for (let j = 1; j < 5; j++) {
        this.cards.push(new Card(i, j));
      }
    }
  }

  /**
   * Shuffle the deck.
   */
  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  /**
   * Getter for cards.
   * @return {Card[]}
   */
  getCards() {
    return this.cards;
  }

  /**
   * Pop a card from the deck.
   *
   * @return {Card | null}
   */
  getCard() {
    return this.cards.pop() || null;
  }
}

module.exports = Deck;

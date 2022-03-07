const Card = require('./Card');
class Deck{
    cards;
    constructor(){
        this.cards = [];
        for (let i = 1; i < 14; i++) {
            for (let j = 1; j < 5; j++) {
                this.cards.push(new Card(i, j));
            }
        }
    }
    shuffle(){
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }
    getCards(){
        return this.cards;
    }

    /**
     *
     * @return {Card}
     */
    getCard(){
        return this.cards.pop();
    }


}
module.exports = Deck;

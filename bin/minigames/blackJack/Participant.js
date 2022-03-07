class Participant{
    /**
     *
     * @param {string} id
     */
    constructor(id=""){
        this.id = id;
        this.score = 0;
        this.cards = [];
    }
    getId(){
        return this.id;
    }
    getScore(){
        return this.score;
    }
    setScore(score){
        this.score = score;
    }
    getCards(){
        return this.cards;
    }

    /**
     *
     * @param {Card} card
     * @return {number}
     */
    addCard(card){
        this.cards.push(card);
        this.score = this.calculateScore();
        return this.score;
    }

    /**
     *
     * @return {number}
     */
    calculateScore(){
        let sum=0;
        let aces =0;
        for(let i=0;i<this.cards.length;i++){
            if(this.cards[i].getValue()===1){
                aces++;
                sum+=11;
            }else if(this.cards[i].getValue()>=10){
                sum+=10;
            }else{
                sum+=this.cards[i].getValue();
            }
        }
        while(sum>21 && aces>0){
            sum=sum-10;
            aces--;
        }
        return sum;
    }

}
module.exports = Participant;

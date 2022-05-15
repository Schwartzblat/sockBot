const {MiniGame} = require('baileys-minigames');
const Deck = require('./blackJack/Deck');
const Participant = require("./blackJack/Participant");

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const messages = {
    'start': 'ברוכים הבאים למשחק בלקג\'ק!\nכדי להצטרף  למשחק כתבו "אני".\nיש לכם 20 שניות להצטרף למשחק והמשחק מוגבל לארבעה משתתפים בלבד.'
}
class blackjackGroup extends MiniGame{
    /**
     *
     * @param {proto.IWebMessageInfo} message
     * @param {makeWASocket} sock
     * @param {makeInMemoryStore} store
     */
    constructor(message, sock, store){
        super();
        this.sock = sock;
        this.chatId = message.key.remoteJid;
        this.players = [];
        this.sock.sendMessage(this.chatId, {text: messages['start']});
        this.store = store;
        this.hasStarted = false;
        sleep(20000).then(()=>{
            if(!this.hasStarted){
                this.hasStarted = true;
                this.startGame();
            }
        });

    }
    async sendStatus(showDealerCards=true){
        let output = '';
        output +='הקלפים של הדילר:\n';
        if(showDealerCards){
            for (let card of this.dealer.getCards()){
                output += card.toString() + ',';
            }
            output += "ניקוד: " + this.dealer.getScore()+"\n\n";
        }else{
            output += this.dealer.getCards()[0].toString() + ', (הפוך)\n\n';
        }
        let mentions = [];
        for (let player of this.players) {
            output += "הקלפים של @"+player.getId().split("@")[0]+":\n";
            mentions.push(player.getId());
            for (let card of player.getCards()) {
                output += card.toString() + ', ';
            }
            output += "\nניקוד: " + player.getScore() + '\n\n';
        }
        await this.sock.sendMessage(this.chatId, {text: output, mentions: mentions});
    }

    async startGame() {
        this.deck = new Deck();
        this.deck.shuffle();
        this.dealer = new Participant();
        this.dealer.addCard(this.deck.getCard());
        this.dealer.addCard(this.deck.getCard());
        for(let player of this.players){
            player.addCard(this.deck.getCard());
            player.addCard(this.deck.getCard());
        }
        await this.sendStatus(false);
        for(let player of this.players){
            if(player.getScore() === 21){

            }
        }
    }

    async procMessage(message){
        if(!this.hasStarted){
            if(message.body === 'אני' && this.players.length < 4 && !this.hasStarted && !this.players.includes(message.key.participant)){
                this.players.push(new Participant(message.key.participant));
                await this.sock.sendMessage(this.chatId, {text: 'הצטרפת בהצלחה!'}, {quoted: message});
                if(this.players.length === 4){
                    this.hasStarted = true;
                    await this.startGame();
                    return;
                }
            }
            return;
        }



    }




}

module.exports = blackjackGroup;



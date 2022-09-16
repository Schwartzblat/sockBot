const fs = require('fs');
const path = require('path');
const {getRandomIntInclusive} = require('../../utils/random');
const baseOutput = '*עיבוד ההודעה הסתיים*\n--------------------------------\nבהתסמך על קצב הלב שלך, הבעות הפנים ותנועות שריר בלתי רצוניות אפשר לקבוע באופן חד משמעי את התוצאות הבאות:\n';
/**
 *
 * @param {proto.IWebMessageInfo} message
 * @param {makeWASocket} sock
 * @return {Promise<void>}
 */
const procCommand = async (message, sock) => {
  const contextInfo = message.message?.extendedTextMessage?.contextInfo;
  if (!contextInfo?.quotedMessage) {
    return;
  }
  const expressions = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../public/expressions.json'), 'utf8'));
  const expression = expressions[getRandomIntInclusive(0, expressions.length - 1, {seed: contextInfo.stanzaId})];
  let output = baseOutput;
  if (sock.user.id.split(':')[0] === contextInfo.participant.split('@')[0]) {
    output='איך אתה מעז לפקפק באמיתות ההודעות שלי?!';
  } else if (getRandomIntInclusive(0, 1)===0) {
    output+='*שקר מוחלט!*\nעל שקרנים כמוכם נאמר פעם המשפט:\n'+expression;
  } else {
    output+='*אמת לאמיתה!*\nעל אנשים ישרים כמוכם נאמר פעם המשפט:\n'+expression;
  }
  const msg = {
    key: {
      remoteJid: message.key.remoteJid,
      id: contextInfo.stanzaId,
      participant: contextInfo.participant,
    },
    message: contextInfo.quotedMessage,
  };
  await sock.sendMessage(message.key.remoteJid, {text: output}, {quoted: msg});
};
module.exports = procCommand;

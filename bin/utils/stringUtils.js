const emojiRegex = require('emoji-regex');

/**
 * Checks if string contains hebrew.
 *
 * @param {string} str
 * @return {boolean}
 */
const containsHe = (str) => {
  return (/[\u0590-\u05FF]/).test(str);
};

/**
 * Reverses string.
 *
 * @param {string} str
 * @return {string}
 */
const reverse = (str) => {
  return str.split('').reverse().join('');
};

/**
 * Revers hebrew in string.
 *
 * @param {string} str
 * @return {string}
 */
const reverseHe = (str) => {
  const words = str.split(' ');
  let reversedWords = [];
  let hebrewWords = [];
  for (let i = 0; i < words.length; i++) {
    if (containsHe(words[i])) {
      hebrewWords.push(reverse(words[i]));
    } else {
      hebrewWords.reverse();
      reversedWords = [...reversedWords, ...hebrewWords];
      hebrewWords = [];
      reversedWords.push(words[i]);
    }
  }
  hebrewWords.reverse();
  reversedWords = [...reversedWords, ...hebrewWords];
  return reversedWords.join(' ');
};

/**
 * Removes a requested amount of words from the start of a string.
 *
 * @param {string} str
 * @param {number} wordCount
 * @return {string}
 */
const removeWordsFromStart = (str, wordCount) => {
  return str.split(' ').splice(wordCount).join(' ');
};

/**
 * Removes the first word from a string.
 *
 * @param {string} str
 * @return {string}
 */
const removeFirstWord = (str) => {
  return removeWordsFromStart(str, 1);
};

/**
 *
 * @param {string} phone
 * @return {*}
 */
const parsePhone = (phone) => {
  let outputPhone = '';
  for (let i = 0; i < phone.length; i++) {
    if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(phone[i])) {
      outputPhone += phone[i];
    }
  }
  return outputPhone.startsWith('0') ?
      '972' + outputPhone.substring(1) :
      outputPhone;
};

const removeEmojis = (str) => {
  const regex = emojiRegex();
  return str.replace(regex, '');
};
const replaceAll = (str, find, replace) => {
  return str.replace(new RegExp(find, 'g'), replace);
};

/**
 *
 * @param {string} text
 * @return {boolean}
 */
const isAskToAsk = (text) => {
  const keyWords1 = [
    'יודע',
    'לעזור',
    'מישהו',
    'יכול',
    'בשאלה',
    'מבין',
    'מכיר',
    'מישהו',
    'עזרה'];
  const keyWords2 = ['יכול לעזור', 'טוב ב', 'מבין ב', 'מישהו יודע'];
  const blackList = ['איך', 'למה'];
  for (const word of blackList) {
    if (text.includes(word)) {
      return false;
    }
  }
  let counter = 0;
  for (const word of keyWords1) {
    if (text.includes(word)) {
      counter++;
    }
  }
  if (counter < 3) {
    return false;
  }
  for (const word of keyWords2) {
    if (text.includes(word)) {
      return true;
    }
  }
  return false;
};

module.exports = {
  containsHe,
  reverse,
  reverseHe,
  removeWordsFromStart,
  removeFirstWord,
  parsePhone,
  removeEmojis,
  replaceAll,
  isAskToAsk,
};

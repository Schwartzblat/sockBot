const translate = require('@vitalets/google-translate-api');

/**
 * Translates a string through google translate api.
 *
 * @param {string} str
 * @return {Promise<string>}
 */
const translateString = async (str) => {
  return await translate(str, {to: 'en'}).then((res) => res.text);
};
const translateStringTo = async (str, lan) => {
  return await translate(str, {to: lan}).then((res) => res.text);
};


module.exports.translateString = translateString;
module.exports.translateStringTo = translateStringTo;

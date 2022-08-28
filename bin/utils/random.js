const seedRandom = require('seedrandom');
const {v4: uuidv4} = require('uuid');

/**
 * @typedef RandomProperties
 * @property {string} seed
 * @property {function} PRNG - JS compatible prng.
 */

/**
 * Returns a random number between <min> and (<max> - 1).
 *
 * @param {number} min
 * @param {number} max
 * @param {{seed: string}} props
 * @return {number}
 */
const getRandomInt = (min, max, props = {}) => {
  let rng = Math.random;
  if (props.seed) {
    rng = seedRandom(props.seed);
  } else if (props.PRNG) {
    rng = props.PRNG;
  }
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(rng() * (max - min) + min);
};

/**
 * Returns a random number between <min> and <max>, inclusive.
 *
 * @param {number} min
 * @param {number} max
 * @param {{seed: string}} props
 * @return {number}
 */
const getRandomIntInclusive = (min, max, props = {}) => {
  return getRandomInt(min, max + 1, props);
};

/**
 * Returns a random element from array, can also use seed.
 * @param {*[]} arr
 * @param {RandomProperties} props
 * @return {*}
 */
const randomFromArr = (arr, props = {}) => {
  return arr[getRandomInt(0, arr.length, props)];
};


/**
 * Returns a randomly generated uuid.
 *
 * @return {string} uuid
 */
const genUUID = () => {
  // Maybe use uuidv5 instead?
  return uuidv4();
};


/**
 * Returns a random key based on custom distribution based on the keys' weights.
 * @param {Object} obj
 * @param {RandomProperties} props
 * @return {any}
 *
 * @example
 * Parameter should look something like this:
 * {
 *   "key": {
 *     "weight": 70
 *   }
 *   "key2": {
 *     "weight": 10
 *   }
 * }
 * NOTE: The weight doesn't represent a percentage, but is calculated on the
 * relative sum of all weights.
 */
const getRandomDistributed = (obj, props = {}) => {
  const weightedArray = [];
  for (const role of Object.values(obj)) {
    for (let i = 0; i < role.weight; i++) {
      weightedArray.push(role);
    }
  }
  return randomFromArr(weightedArray, props);
};

module.exports = {
  getRandomIntInclusive,
  getRandomInt,
  randomFromArr,
  getRandomDistributed,
  genUUID,
};

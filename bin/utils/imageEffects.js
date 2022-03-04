const Jimp = require('jimp');

/**
 * Expends image from all sides equally. Expended sections will be transparent.
 *
 * @param {Jimp} image
 * @param {int} widthAdd
 * @param {int} heightAdd
 * @return {Promise<Jimp>}
 */
const expend = async (image, widthAdd, heightAdd) => {
  const backgroundPic = new Jimp(image.getWidth() + widthAdd,
      image.getHeight() + heightAdd);
  return (await backgroundPic.composite(image, widthAdd / 2, heightAdd / 2));
};

/**
 * Expends image and adds shadow.
 *
 * @param {Jimp} image
 * @param {number} [widthAdd]
 * @param {number} [heightAdd]
 * @param {Object} [options]
 * @return {Promise<Jimp>}
 */
const shadow = async (image, widthAdd = 0, heightAdd = 0, options) => {
  const newImage = await expend(image, widthAdd, heightAdd);
  return (await newImage.shadow(options));
};

module.exports = {
  expend,
  shadow,
};

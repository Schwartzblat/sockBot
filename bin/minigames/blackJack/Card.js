/**
 * @typedef {number} Values
 */

/**
 * @typedef {number} Shapes
 */

/**
 * Enum of card values.
 *
 * @enum {number}
 */
const Values = {
  1: 'אס',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
  11: 'נסיך',
  12: 'מלכה',
  13: 'מלך',
};
/**
 * Enum of card suits.
 *
 * @enum {number}
 */
const Shapes = {
  1: 'תלתן',
  2: 'עלה',
  3: 'לבבות',
  4: 'יהלומים',
};

/**
 * Class representing a card.
 */
class Card {
  /**
   * Constructor.
   * @param {Values} [val=0]
   * @param {Shapes} [shape=0]
   */
  constructor(val = 0, shape = 0) {
    this.value = val;
    this.shape = shape;
  }

  /**
   * Getter for shape.
   *
   * @return {Shapes}
   */
  getShape() {
    return this.shape;
  }

  /**
   * Getter for value.
   *
   * @return {Values}
   */
  getValue() {
    return this.value;
  }

  /**
   * Setter for shape.
   *
   * @param {Shapes} shape
   */
  setShape(shape) {
    this.shape = shape;
  }

  /**
   * Setter for value.
   *
   * @param {Values} val
   */
  setValue(val) {
    this.value = val;
  }

  /**
   * To string method.
   *
   * @return {string}
   */
  toString() {
    return Values[this.value] + ' ' + Shapes[this.shape];
  }
}

module.exports = Card;

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
const Shapes = {
  1: 'תלתן',
  2: 'עלה',
  3: 'לבבות',
  4: 'יהלומים',
};
class Card {
  constructor(val= 0, shape=0) {
    this.value = val;
    this.shape = shape;
  }
  getShape() {
    return this.shape;
  }
  getValue() {
    return this.value;
  }
  setShape(shape) {
    this.shape = shape;
  }
  setValue(val) {
    this.value = val;
  }
  toString() {
    return Values[this.value] + ' ' + Shapes[this.shape];
  }
}
module.exports = Card;

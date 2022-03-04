/**
 * Participant class.
 */
class Participant {
  /**
   * Creates a participant instance.
   *
   * @param {string} id
   * @param {number} score
   */
  constructor(id, score) {
    this.id = id;
    this.score = score;
  }

  /**
   * Getter for phoneNumber.
   *
   * @return {string}
   */
  getId() {
    return this.id;
  }

  /**
   * Getter for score.
   *
   * @return {number}
   */
  getScore() {
    return this.score;
  }

  /**
   * Alters instance score by a specified amount.
   *
   * @param {number} points
   */
  alterScore(points) {
    this.score += points;
  }

  /**
   * Returns a string made out of the participant's data, and ready for tagging.
   *
   * @return {string}
   */
  toString() {
    return '@' + this.getId().split('@')[0] + ' ' + this.getScore() +
        ' points\n';
  }
}

module.exports = Participant;

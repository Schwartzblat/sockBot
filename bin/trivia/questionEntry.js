/**
 * QuestionEntry class.
 */
class QuestionEntry {
  /**
   * Creates a question instance.
   *
   * @param {object} rawQuestion
   */
  constructor(rawQuestion) {
    this.question = rawQuestion['question'];
    // Shuffle answers.
    this.answers = rawQuestion['answers'].sort(() => Math.random() - 0.5);
    this.correctAnswer = rawQuestion['correct'];
  }

  /**
   * Getter for the question.
   *
   * @return {string}
   */
  getQuestion() {
    return this.question;
  }

  /**
   * Getter for the answers' array.
   *
   * @return {string[]}
   */
  getAnswers() {
    return this.answers;
  }

  /**
   * Getter for correct answer.
   *
   * @return {string}
   */
  getCorrectAnswer() {
    return this.correctAnswer;
  }

  /**
   * Returns the index of the correct answer in the answers' array.
   *
   * @return {number}
   */
  getCorrectAnswerIndex() {
    return this.getAnswers().
        findIndex((element) => element === this.getCorrectAnswer());
  }

  /**
   * Maps question to a fitting string.
   *
   * @return {string}
   */
  toString() {
    let output = '*' + this.getQuestion() + '*' + '\n\n';
    output += '1. ' + this.getAnswers()[0] + '\n';
    output += '2. ' + this.getAnswers()[1] + '\n';
    output += '3. ' + this.getAnswers()[2] + '\n';
    output += '4. ' + this.getAnswers()[3] + '\n';
    return output;
  }
}

module.exports = QuestionEntry;

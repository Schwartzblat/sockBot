/**
 * Returns a number whose value is limited to the given range.
 *
 * Example: limit the output of this computation to between 0 and 255
 * clamp(1000,0, 255)
 *
 * @param num {number} number to clamp
 * @param min {number} min The lower boundary of the output range
 * @param max {number} max The upper boundary of the output range
 * @return A number in range [min,max]
 */
const clamp = (num, min, max) => {
    return Math.min(Math.max(num, min), max);
}

module.exports = {
    clamp,
}
/**
 * @param {number} ms
 */
 module.exports = ms => new Promise(resolve => setTimeout(resolve, ms));
/**
 * Scrapers Index - Routes to platform-specific scrapers
 */

const sahibinden = require('./sahibinden');
const hepsiemlak = require('./hepsiemlak');
const emlakjet = require('./emlakjet');

module.exports = {
    sahibinden,
    hepsiemlak,
    emlakjet
};

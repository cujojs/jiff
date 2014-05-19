var commuteRtL = require('./commute').rtl;
var inverse = require('./inverse');

/**
 * Given a patch history (array of patches) and a single patch, rooted
 * at the same starting document context d1, rebase patch onto history
 * so that d1 + history -> d2, d2 + patch -> d3
 * @param {array<array>} history array of JSON Patch
 * @param {array} patch JSON Patch
 * @returns {array} rebased patch which can be applied after history
 */
module.exports = function rebase(history, patch) {
	return history.reduce(function(commuted, patchFromHistory) {
		return commuteRtL(inverse(patchFromHistory), commuted);
	}, patch);
};

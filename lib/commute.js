var patches = require('./patches');

module.exports = commute;

commute.rtl = commuteRtL;

/**
 * Given adjacent patch pair p1,p2, commute them to create a new
 * adjacent pair p2',p1'
 * @param {array} p1 JSON Patch
 * @param {array} p2 JSON Patch
 * @returns {array<array>} pair [commutedRight, commutedLeft]
 */
function commute(p1, p2) {
	return runCommute(keepBoth, [[], []], p1, p2);
}
/**
 * Commute left and right and return only the newly commuted left, throwing
 * away the newly commuted right.
 * @param p1
 * @param p2
 * @returns {*}
 */
function commuteRtL(p1, p2) {
	return runCommute(keepLeft, [], p1, p2);
}

function runCommute(f, accum, p1, p2) {
	return p2.reduce(function(accum, p2) {
		return p1.reduceRight(function(accum, p1) {
			return commuteOne(f, accum, p1, p2);
		}, accum);
	}, accum)
}

function commuteOne (f, accum, p1, p2) {
	var patch = patches[p2.op];
	if (patch === void 0 || typeof patch.commute !== 'function') {
		throw new TypeError('patches cannot be commuted');
	}

	return f(accum, patch.commute(p1, p2));
}

function keepBoth(pair, commuted) {
	pair[0].push(commuted[0]);
	pair[1].push(commuted[1]);
	return pair;
}

function keepLeft(left, commuted) {
	left.push(commuted[0]);
	return left;
}

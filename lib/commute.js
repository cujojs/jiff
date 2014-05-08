var patches = require('./patches');

module.exports = function commute(left, right) {
	return right.reduce(function(pair, p1) {
		return left.reduceRight(function(pair, p2) {
			return commuteOne(pair, p1, p2);
		}, pair);
	}, { left: [], right: [] })
};

function commuteOne (pair, p1, p2) {
	var patch = patches[p2.op];
	var commuted;

	if (patch === void 0 || typeof patch.commute !== 'function') {
		throw new TypeError('patches cannot be commuted');
	}

	commuted = patch.commute(p1, p2);
	pair.left.push(commuted[0]);
	pair.right.push(commuted[1]);

	return pair;
}

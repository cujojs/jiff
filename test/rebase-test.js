var buster = require('buster');
var assert = buster.referee.assert;

var rebase = require('../lib/rebase');
var jiff = require('../jiff');
var deepEquals = require('../lib/deepEquals');

buster.testCase('rebase', {
	'should allow parallel patches': function() {
		var d1 = [1,2,3,4,5];
		var d2a = [1,2,4,5];
		var d2b = [1,2,3,6,4,5];
		var d3 = [1,2,6,4,5];

		// Two parallel patches created from d1
		var d1pd2a = jiff.diff(d1, d2a);
		var d1pd2b = jiff.diff(d1, d2b);

		// Rebase d1pd2b onto d1pd2a
		var d2apd2b = rebase([d1pd2a], d1pd2b);

		var d3a = jiff.patch(d2apd2b, jiff.patch(d1pd2a, d1));
		assert(deepEquals(d3, d3a));
	}

});
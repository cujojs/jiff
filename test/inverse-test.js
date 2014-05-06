var buster = require('buster');
var json = require('gent/generator/json');
var assert = buster.referee.assert;
var deepEquals = require('../lib/deepEquals');

var inverse = require('../lib/inverse');
var jiff = require('../jiff');

buster.testCase('inverse', {
	'for objects': {
		'should have inverse effect': function() {
			assert.claim(function(a, b) {
				var p = jiff.diff(a, b);
				var a2 = jiff.patch(inverse(p), b);
				return deepEquals(a, a2);
			}, json.object(), json.object());
		},

		'should be an involution': function() {
			assert.claim(function(a, b) {
				var p = jiff.diff(a, b);
				var b2 = jiff.patch(inverse(inverse(p)), a);
				return deepEquals(b, b2);
			}, json.object(), json.object());
		}
	},

	'for arrays': {
		'should have inverse effect': function() {
			assert.claim(function(a, b) {
				var p = jiff.diff(a, b);
				var a2 = jiff.patch(inverse(p), b);
				return deepEquals(a, a2);
			}, json.array(), json.array());
		},

		'should be an involution': function() {
			assert.claim(function(a, b) {
				var p = jiff.diff(a, b);
				var b2 = jiff.patch(inverse(inverse(p)), a);
				return deepEquals(b, b2);
			}, json.array(), json.array());
		}
	},

	'should fail when patch is not invertible': {
		'because it contains a remove not preceded by test': function() {
			assert.exception(function() {
				inverse([{ op: 'remove', path: '/a' }]);
			}, 'PatchNotInvertibleError');
		},

		'because it contains a replace not preceded by test': function() {
			assert.exception(function() {
				inverse([{ op: 'replace', path: '/a', value: 'b' }]);
			}, 'PatchNotInvertibleError');
		},

		'because it contains a copy operation': function() {
			assert.exception(function() {
				inverse([{ op: 'copy', path: '/a', from: '/b' }]);
			}, 'PatchNotInvertibleError');
		}
	}
});
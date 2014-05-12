var buster = require('buster');
var assert = buster.referee.assert;
var gent = require('gent');

var deepEquals = require('../lib/deepEquals');

var patches = require('../lib/patches');

function segment() {
	return gent.string(gent.integer(1, 10), gent.char('a', 'z'));
}

function path() {
	return gent.string(
		gent.integer(1, 10),
		gent.string(2, gent.sequence('/', segment()))
	);
}

buster.testCase('commute', {
	'test': {
		'always commutes with test': function() {
			assert.claim(function(path) {
				var a = { op: 'test', path: path };
				var b = { op: 'test', path: path };
				var commuted = patches.test.commute(a, b);
				return deepEquals(a, commuted[1]) && deepEquals(b, commuted[0]);
			}, path());
		},

		'always commutes with replace': function() {
			assert.claim(function(path) {
				var a = { op: 'test', path: path };
				var b = { op: 'replace', path: path };
				var commuted = patches.test.commute(a, b);
				return deepEquals(a, commuted[1]) && deepEquals(b, commuted[0]);
			}, path());
		}
	},

	'remove': {
		'when paths are identical': {
			'cannot from right to left with other patches': function() {
				assert.claim(function(op, path) {
					var a = { op: op, path: path };
					var b = { op: 'remove', path: path };
					try {
						patches[op].commute(a, b);
						return false;
					} catch(e) {
						return true;
					}
				}, gent.pick('test', 'add', 'replace', 'move', 'copy'), path());
			},

			'can commute with remove': function() {
				assert.claim(function(path) {
					var a = { op: 'remove', path: path };
					var b = { op: 'remove', path: path };
					var commuted = patches.remove.commute(a, b);
					return deepEquals(a, commuted[1]) && deepEquals(b, commuted[0]);
				}, path());

			}
		}
	}

});
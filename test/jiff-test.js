var buster = require('buster');
require('gent/test-adapter/buster');
var assert = buster.referee.assert;
var gent = require('gent');
var json = require('gent/generator/json');
var deepEquals = require('../lib/deepEquals');

var jiff = require('../jiff');

buster.testCase('jiff', {
	'diff and patch should be inverses': {
		'for objects': function() {
			assert.claim(deepEqualAfterDiffPatch(), json.object(), json.object());
		},

		'for arrays': function() {
			assert.claim(deepEqualAfterDiffPatch(),
				json.array(10, gent.string(gent.integer(2, 64))),
				json.array(10, gent.string(gent.integer(2, 64))));
		},

		'for arrays of objects': function() {
			assert(deepEqualAfterDiffPatch()(
				[{name:'a'},{name:'b'},{name:'c'}],
				[{name:'b'}]
			));

			assert(deepEqualAfterDiffPatch()(
				[{name:'a'}],
				[{name:'b'}]
			));

			assert(deepEqualAfterDiffPatch()(
				[{name:'a'},{name:'b'},{name:'c'}],
				[{name:'d'}]
			));

			assert(deepEqualAfterDiffPatch()(
				[{name:'b'}],
				[{name:'a'},{name:'b'},{name:'c'}]
			));

			assert(deepEqualAfterDiffPatch()(
				[{name:'d'}],
				[{name:'a'},{name:'b'},{name:'c'}]
			));

			assert.claim(deepEqualAfterDiffPatch(),
				json.array(1, json.object()),
				json.array(1, json.object())
			);
		}
	},

	'diff': {
		'on arrays': {
			'should generate - or length for path suffix when appending': function() {
				var patch = jiff.diff([], [1]);
				assert.equals(patch[0].op, 'add');
				assert(patch[0].path === '/-' || patch[0].path === '/0');
				assert.same(patch[0].value, 1);
			}
		},

		'invertible': {
			'when false': {
				'should not generate extra test ops for array remove': function() {
					var patch = jiff.diff([1,2,3], [1,3], { invertible: false });
					assert.equals(patch.length, 1);
					assert.equals(patch[0].op, 'remove');
				},

				'should not generate extra test ops for object remove': function() {
					var patch = jiff.diff({ foo: 1 }, {}, { invertible: false });
					assert.equals(patch.length, 1);
					assert.equals(patch[0].op, 'remove');
				},

				'should not generate extra test ops for replace': function() {
					var patch = jiff.diff({ foo: 1 }, { foo: 2 }, { invertible: false });
					assert.equals(patch.length, 1);
					assert.equals(patch[0].op, 'replace');
				}
			}
		}
	}
});

function deepEqualAfterDiffPatch(hasher) {
	return function(a, b) {
		var p = jiff.diff(a, b, hasher);
		var b2 = jiff.patch(p, a);
		return deepEquals(b, b2);
	};
}

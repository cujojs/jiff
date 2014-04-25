var buster = require('buster');
var gent = require('gent');
var json = require('gent/generator/json');
var assert = buster.assert;
var refute = buster.refute;
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

	'add': {
		'should add': function() {
			var a = {};
			var result = jiff.patch([{ op: 'add', path: '/value', value: 1 }], a);
			assert.equals(result.value, 1);
		},

		'should replace': function() {
			var a = { value: 0 };
			var result = jiff.patch([{ op: 'add', path: '/value', value: 1 }], a);
			assert.equals(result.value, 1);
		},

		'should throw': {
			'when path is invalid': function() {
				assert.exception(function() {
					jiff.patch([{ op: 'add', path: '/a/b', value: 1 }], {});
				}, 'InvalidPatchOperationError');
			},

			'when target is null': function() {
				assert.exception(function() {
					jiff.patch([{ op: 'add', path: '/a', value: 1 }], null);
				}, 'InvalidPatchOperationError');
			},

			'when target is undefined': function() {
				assert.exception(function() {
					jiff.patch([{ op: 'add', path: '/a', value: 1 }], void 0);
				}, 'InvalidPatchOperationError');
			},

			'when target is not an object or array': function() {
				assert.exception(function() {
					jiff.patch([{ op: 'add', path: '/a/b', value: 1 }], { a: 0 });
				}, 'InvalidPatchOperationError');
			}
		}
	},


	'should throw when op is remove': {
		'and path is invalid': function() {
			assert.exception(function() {
				jiff.patch([{ op: 'remove', path: '/a', value: 1 }], {});
			}, 'InvalidPatchOperationError');
		},

		'and target is null': function() {
			assert.exception(function() {
				jiff.patch([{ op: 'remove', path: '/a', value: 1 }], null);
			}, 'InvalidPatchOperationError');
		},

		'and target is undefined': function() {
			assert.exception(function() {
				jiff.patch([{ op: 'remove', path: '/a', value: 1 }], void 0);
			}, 'InvalidPatchOperationError');
		}
	},

	'should throw when op is replace': {
		'and path is invalid': function() {
			assert.exception(function() {
				jiff.patch([{ op: 'replace', path: '/a', value: 1 }], {});
			}, 'InvalidPatchOperationError');
		},

		'and target is null': function() {
			assert.exception(function() {
				jiff.patch([{ op: 'replace', path: '/a', value: 1 }], null);
			}, 'InvalidPatchOperationError');
		},

		'and target is undefined': function() {
			assert.exception(function() {
				jiff.patch([{ op: 'replace', path: '/a', value: 1 }], void 0);
			}, 'InvalidPatchOperationError');
		}
	},

	'move': {
		'should move': function() {
			var a = { x: 1 };
			var result = jiff.patch([{ op: 'move', path: '/y', from: '/x' }], a);
			assert.equals(result.y, 1);
			refute.defined(result.x);
		}
	},

	'copy': {
		'should copy': function() {
			var a = { x: { value: 1 } };
			var result = jiff.patch([{ op: 'copy', path: '/y', from: '/x' }], a);
			assert.equals(result.x.value, 1);
			assert.equals(result.y.value, 1);
			refute.same(result.x, result.y);
		}
	},

	'test': {
		'should pass when values are deep equal': function() {
			var test = {
				num: 1,
				string: 'bar',
				bool: true,
				array: [1, { name: 'x' }, 'baz', true, false, null],
				object: {
					value: 2
				}
			};
			var a = { x: test };
			var y = jiff.clone(test);

			refute.exception(function() {
				var result = jiff.patch([{ op: 'test', path: '/x', value: y }], a);
				assert.equals(JSON.stringify(a), JSON.stringify(result));
			});
		},

		'should fail when values are not deep equal': function() {
			var test = { array: [1, { name: 'x' }] };
			var y = jiff.clone(test);

			test.array[1].name = 'y';
			var a = { x: test };

			assert.exception(function() {
				jiff.patch([{ op: 'test', path: '/x', value: y }], a);
			}, 'TestFailedError');
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

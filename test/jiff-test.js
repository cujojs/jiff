var buster = require('buster');
var gent = require('gent');
var json = require('gent/generator/json');
var assert = buster.assert;

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
	}
});

function deepEqualAfterDiffPatch(hasher) {
	return function(a, b) {
		var p = jiff.diff(a, b, hasher);
		var b2 = jiff.patch(p, a);
		return deepEqualJson(b, b2);
	};
}

function deepEqualJson(a, b) {
	if(a === b) {
		return true;
	}

	if(Array.isArray(a) && Array.isArray(b)) {
		return compareArrays(a, b);
	}

	if(typeof a === 'object' && typeof b === 'object') {
		return compareObjects(a, b);
	}

	return false;
}

function compareArrays(a, b) {
	if(a.length !== b.length) {
		return false;
	}

	for(var i = 0; i<a.length; ++i) {
		if(!deepEqualJson(a[i], b[i])) {
			return false;
		}
	}

	return true;
}

function compareObjects(a, b) {
	var akeys = Object.keys(a);
	var bkeys = Object.keys(b);

	if(akeys.length !== bkeys.length) {
		return false;
	}

	for(var i = 0, k; i<akeys.length; ++i) {
		k = akeys[i];
		if(!(k in b && deepEqualJson(a[k], b[k]))) {
			return false;
		}
	}

	return true;
}
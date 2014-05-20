var buster = require('buster');
var assert = buster.referee.assert;
var refute = buster.referee.refute;

var patches = require('../lib/patches');
var jsonPatch = require('../lib/jsonPatch');
var InvalidPatchOperationError = require('../lib/InvalidPatchOperationError');

buster.testCase('jsonPatch', {
	'add': {
		'should add': function() {
			var a = {};
			var result = jsonPatch.apply([{ op: 'add', path: '/value', value: 1 }], a);
			assert.equals(result.value, 1);
		},

		'should replace': function() {
			var a = { value: 0 };
			var result = jsonPatch.apply([{ op: 'add', path: '/value', value: 1 }], a);
			assert.equals(result.value, 1);
		},

		'should throw': {
			'when path is invalid': function() {
				assert.exception(function() {
					jsonPatch.apply([{ op: 'add', path: '/a/b', value: 1 }], {});
				}, 'InvalidPatchOperationError');
			},

			'when target is null': function() {
				assert.exception(function() {
					jsonPatch.apply([{ op: 'add', path: '/a', value: 1 }], null);
				}, 'InvalidPatchOperationError');
			},

			'when target is undefined': function() {
				assert.exception(function() {
					jsonPatch.apply([{ op: 'add', path: '/a', value: 1 }], void 0);
				});
			},

			'when target is not an object or array': function() {
				assert.exception(function() {
					jsonPatch.apply([{ op: 'add', path: '/a/b', value: 1 }], { a: 0 });
				}, 'InvalidPatchOperationError');
			}
		}
	},


	'remove': {
		'should remove': function() {
			var a = { value: 0 };
			var result = jsonPatch.apply([{ op: 'remove', path: '/value'}], a);
			refute.defined(result.value);
		},

		'should throw': {
			'when path is invalid': function() {
				assert.exception(function() {
					jsonPatch.apply([{ op: 'remove', path: '/a', value: 1 }], {});
				}, 'InvalidPatchOperationError');
			},

			'when target is null': function() {
				assert.exception(function() {
					jsonPatch.apply([{ op: 'remove', path: '/a', value: 1 }], null);
				}, 'InvalidPatchOperationError');
			},

			'when target is undefined': function() {
				assert.exception(function() {
					jsonPatch.apply([{ op: 'remove', path: '/a', value: 1 }], void 0);
				});
			}
		}
	},

	'replace': {
		'should replace': function() {
			var a = { value: 0 };
			var result = jsonPatch.apply([{ op: 'add', path: '/value', value: 1 }], a);
			assert.equals(result.value, 1);
		},

		'should throw': {
			'when path is invalid': function() {
				assert.exception(function() {
					jsonPatch.apply([{ op: 'replace', path: '/a', value: 1 }], {});
				}, 'InvalidPatchOperationError');
			},

			'when target is null': function() {
				assert.exception(function() {
					jsonPatch.apply([{ op: 'replace', path: '/a', value: 1 }], null);
				}, 'InvalidPatchOperationError');
			},

			'when target is undefined': function() {
				assert.exception(function() {
					jsonPatch.apply([{ op: 'replace', path: '/a', value: 1 }], void 0);
				});
			}
		}
	},

	'move': {
		'should move': function() {
			var a = { x: 1 };
			var result = jsonPatch.apply([{ op: 'move', path: '/y', from: '/x' }], a);
			assert.equals(result.y, 1);
			refute.defined(result.x);
		},

		'should not allow moving to ancestor path': function() {
			var from = '/a/b/c';
			var to = '/a/b';
			assert.exception(function() {
				patches.move.apply({ a: { b: { c: 1 }}}, { op: 'move', from: from, path: to });
			});
		}
	},

	'copy': {
		'should copy': function() {
			var a = { x: { value: 1 } };
			var result = jsonPatch.apply([{ op: 'copy', path: '/y', from: '/x' }], a);
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
			var y = jsonPatch.clone(test);

			refute.exception(function() {
				var result = jsonPatch.apply([{ op: 'test', path: '/x', value: y }], a);
				assert.equals(JSON.stringify(a), JSON.stringify(result));
			});
		},

		'should fail when values are not deep equal': function() {
			var test = { array: [1, { name: 'x' }] };
			var y = jsonPatch.clone(test);

			test.array[1].name = 'y';
			var a = { x: test };

			assert.exception(function() {
				jsonPatch.apply([{ op: 'test', path: '/x', value: y }], a);
			}, 'TestFailedError');
		}
	}
});

var buster = require('buster');
var assert = buster.referee.assert;

var commutePaths = require('../lib/commutePaths');
var jsonPatch = require('../lib/jsonPatch');
var deepEquals = require('../lib/deepEquals');

var doc = [0,1,2,3,4,5,6,7,8,9];

buster.testCase('commutePaths', {

	'add,remove -> remove,add': {
		'paths same length, add lower index': function() {
			var l = { op: 'add',    path: '/foo/0' };
			var r = { op: 'remove', path: '/foo/1' };

			var rl = commutePaths(l, r);
			assert.equals(rl[0].path, '/foo/0');
			assert.equals(rl[1].path, '/foo/0');
		},

		'paths same length, add higher index': function() {
			var l = { op: 'add',    path: '/foo/1' };
			var r = { op: 'remove', path: '/foo/0' };

			var rl = commutePaths(l, r);
			assert.equals(rl[0].path, '/foo/0');
			assert.equals(rl[1].path, '/foo/0');
		},

		'add longer path, add lower index': function() {
			var l = { op: 'add',    path: '/foo/0/x' };
			var r = { op: 'remove', path: '/foo/1' };

			var rl = commutePaths(l, r);
			assert.equals(rl[0].path, '/foo/1');
			assert.equals(rl[1].path, '/foo/0/x');
		},

		'add longer path, add higher index': function() {
			var l = { op: 'add',    path: '/foo/1/x' };
			var r = { op: 'remove', path: '/foo/0' };

			var rl = commutePaths(l, r);
			assert.equals(rl[0].path, '/foo/0');
			assert.equals(rl[1].path, '/foo/0/x');
		}
	},

	'remove,add -> add,remove': {
		'paths same length, remove lower index': function() {
			var l = { op: 'remove', path: '/foo/0' };
			var r = { op: 'add',    path: '/foo/1' };

			var rl = commutePaths(l, r);
			assert.equals(rl[0].path, '/foo/2');
			assert.equals(rl[1].path, '/foo/0');
		},

		'paths same length, remove higher index': function() {
			var l = { op: 'remove', path: '/foo/1' };
			var r = { op: 'add',    path: '/foo/0' };

			var rl = commutePaths(l, r);
			assert.equals(rl[0].path, '/foo/0');
			assert.equals(rl[1].path, '/foo/2');
		},

		'remove longer path, remove lower index': function() {
			var l = { op: 'remove', path: '/foo/0/x' };
			var r = { op: 'add',    path: '/foo/1', value: 1 };

			var rl = commutePaths(l, r);
			assert.equals(rl[0].path, '/foo/1');
			assert.equals(rl[1].path, '/foo/0/x');
		},

		'remove longer path, remove higher index': function() {
			var l = { op: 'remove', path: '/foo/1/x' };
			var r = { op: 'add',    path: '/foo/0', value: 1 };

			var rl = commutePaths(l, r);
			assert.equals(rl[0].path, '/foo/0');
			assert.equals(rl[1].path, '/foo/2/x');
		}
	}//,

//	'when add-add, paths same length': function() {
//		var l = { op: 'add', path: '/foo/0', value: 0 };
//		var r = { op: 'add', path: '/foo/1', value: 1 };
//
//		var rl = commutePaths(l, r);
//		assert.equals(rl[0].path, '/foo/0');
//		assert.equals(rl[1].path, '/foo/0');
//	},
//
//	'when add-remove with longer path': function() {
//		var l = { op: 'add',    path: '/foo/1/x', value: 1 };
//		var r = { op: 'remove', path: '/foo/0' };
//
//		var rl = commutePaths(l, r);
//		assert.equals(rl[0].path, '/foo/0');
//		assert.equals(rl[1].path, '/foo/0/x');
//	},
//
//	'with add': function() {
//		var l = { op: 'add', path: '/foo/1/x', value: 0 };
//		var r = { op: 'add', path: '/foo/0',   value: 1 };
//
//		var rl = commutePaths(l, r);
//		assert.equals(rl[0].path, '/foo/0');
//		assert.equals(rl[1].path, '/foo/2/x');
//	}
});
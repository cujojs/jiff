var buster = require('buster');
var assert = buster.referee.assert;

var parse = require('../lib/jsonPointerParse');

buster.testCase('jsonPointerParse', {

	'should call onSegment callback once if passed a blank string': function () {
		var onSegment = this.spy();
		parse('', onSegment);
		assert.calledOnceWith(onSegment, '');
	},
	'should call onSegment callback once if passed a single slash': function () {
		var onSegment = this.spy();
		parse('/', onSegment);
		assert.calledOnceWith(onSegment, '');
	},
	'should call onSegment once a single-segment path': function () {
		var onSegment = this.spy();
		parse('/foo', onSegment);
		assert.calledOnceWith(onSegment, 'foo');
	},
	'should call onSegment once a single-segment path with encoding': function () {
		var onSegment;
		onSegment = this.spy();
		parse('/m~0n', onSegment);
		assert.calledOnceWith(onSegment, 'm~n');
		onSegment = this.spy();
		parse('/a~1b', onSegment);
		assert.calledOnceWith(onSegment, 'a/b');
	},
	'should call onSegment for each segment in a multi-segment path': function () {
		var onSegment = this.spy();
		parse('/foo/bar/0', onSegment);
		assert.calledThrice(onSegment);
		assert.calledWithExactly(onSegment, 'foo');
		assert.calledWithExactly(onSegment, 'bar');
		assert.calledWithExactly(onSegment, '0');
	},
	'should call onSegment for each segment in a multi-segment path with encoding': function () {
		var onSegment = this.spy();
		parse('/m~0n/a~1b/~01', onSegment);
		assert.calledThrice(onSegment);
		assert.calledWithExactly(onSegment, 'm~n');
		assert.calledWithExactly(onSegment, 'a/b');
		assert.calledWithExactly(onSegment, '~1');
	},
	'should bail early if onSegment returns false': function () {
		var onSegment = this.spy(function () { return false; });
		parse('/foo/bar/0', onSegment);
		assert.calledOnce(onSegment);
	}

});

/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var jsonPointer = require('../lib/jsonPointer');
var json = require('gent/generator/json');

var docDepth = 20;
var numTests = 10000;
var tests = [];

var i, start, b;
var o;
var string = json.key();

function addKey (n, o) {
	if (n === 0) {
		return '';
	}

	var child = {};
	var k = string.next().value;
	o[k] = child;
	return '/' + k + addKey(n - 1, child);
}

for (i = 0; i < numTests; ++i) {
	o = {};
	tests.push({
		path: addKey(docDepth, o),
		data: o
	});
}

// warm up JIT
for (i = 0; i < numTests; ++i) {
	b = jsonPointer.find(tests[i].data, tests[i].path);
}

start = Date.now();

// run tests
for (i = 0; i < numTests; ++i) {
	b = jsonPointer.find(tests[i].data, tests[i].path);
}

console.log('find', Date.now() - start);

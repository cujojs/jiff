var jiff = require('../jiff');
var json = require('gent/generator/json');


var n = 4;
var o = json.object(8);
var a = makeArray(o, 1, 1000);

test(a);

var start = Date.now();
for(var i=0; i<n; ++i) {
	test(a);
}
console.log((Date.now() - start) / n);

function test(array) {
	return testPatch(testDiff(array), array);
}

function testDiff(array) {
	return jiff.diff(array, modify(array), byId);
}

function testPatch (patch, array) {
	return jiff.patch(patch, array);
}

function modify(array) {
	var a2 = array.slice();
	a2.splice(Math.floor(a2.length/2), Math.min(10, a2.length));
	return a2.concat(makeArray(o, array.length+1, 2));
}

function makeArray(o, id, n) {
	var a = new Array(n);
	for(var i=0; i<n; ++i) {
		a[i] = getObject(o, id++);
	}
	return a;
}

function getObject(o, id) {
	var x = o.next().value;
	x.id = id;
	return JSON.parse(JSON.stringify(x));
}

function byId(x) {
	return x.id || JSON.stringify(x);
}
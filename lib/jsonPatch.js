/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var jsonPointer = require('./jsonPointer');

exports.apply = patch;
exports.clone = clone;

var jsonDateRx = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)(Z|([+\-])(\d{2}):(\d{2}))$/;

var ops = {
	add: add,
	replace: setValue,
	remove: remove
};

/**
 * Apply the supplied JSON Patch to x
 * @param {array} changes JSON Patch
 * @param {object|array|string|number} x object/array/value to patch
 * @returns {object|array|string|number} patched version of x. If x is
 *  an array or object, it will be mutated and returned. Otherwise, if
 *  x is a value, the new value will be returned.
 */
function patch(changes, x) {
	return doPatch(ops, changes, x);
}

/**
 * Create a deep copy of x which must be a value JSON object/array/value
 * @param {object|array|string|number} x object/array/value to clone
 * @returns {object|array|string|number} clone of x
 */
function clone(x) {
	return JSON.parse(JSON.stringify(x), dateReviver);
}

function doPatch(ops, changes, x) {
	if(!changes || changes.length === 0) {
		return x;
	}

	return changes.reduce(function(x, change) {
		var op;
		if(change.path.length === 0) {
			return change.value;
		}

		op = ops[change.op];
		if(op) {
			op(x, change);
		}

		return x;
	}, x);
}

function add(x, change) {
	var value = typeof change.value === 'object' ? clone(change.value) : change.value;
	jsonPointer.add(x, change.path, value);
}

function setValue(x, change) {
	var value = typeof change.value === 'object' ? clone(change.value) : change.value;
	jsonPointer.setValue(x, change.path, value);
}

function remove(x, change) {
	jsonPointer.remove(x, change.path);
}

function dateReviver(_, value) {
	var match;

	if (typeof value === 'string') {
		match = jsonDateRx.exec(value);
		if (match) {
			return new Date(Date.UTC(
					+match[1], +match[2] - 1, +match[3],
					+match[4], +match[5], +match[6])
			);
		}
	}

	return value;
}

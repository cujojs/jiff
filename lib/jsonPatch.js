/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var jsonPointer = require('./jsonPointer');
var InvalidPatchOperationError = require('./InvalidPatchOperationError');

exports.apply = patch;
exports.clone = clone;

var jsonDateRx = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)(Z|([+\-])(\d{2}):(\d{2}))$/;

var ops = {
	add: add,
	replace: replace,
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

/**
 * Apply an add operation to x
 * @param {object|array} x
 * @param {object} change add operation
 */
function add(x, change) {
	var pointer = jsonPointer.find(x, change.path);

	if(pointer === void 0) {
		throw new InvalidPatchOperationError(change, 'parent path does not exist');
	}

	var target = pointer.target;
	var value = typeof change.value === 'object'
		? clone(change.value) : change.value;

	if(Array.isArray(target)) {
		pointer.target.splice(parseArrayIndex(pointer.key, change), 0, value);
	} else if(target !== null && typeof target === 'object') {
		target[pointer.key] = value;
	} else {
		throw new InvalidPatchOperationError(change, 'parent path does not designate an existing object or array')
	}
}

/**
 * Apply a replace operation to x
 * @param {object|array} x
 * @param {object} change replace operation
 */
function replace(x, change) {
	var pointer = jsonPointer.find(x, change.path);

	if(pointer === void 0 || pointer.target[pointer.key] === void 0) {
		throw new InvalidPatchOperationError(change, 'path does not exist');
	}

	pointer.target[pointer.key] = typeof change.value === 'object'
		? clone(change.value) : change.value;
}

/**
 * Apply a remove operation to x
 * @param {object|array} x
 * @param {object} change remove operation
 */
function remove(x, change) {
	var pointer = jsonPointer.find(x, change.path);

	if(pointer === void 0 || pointer.target[pointer.key] === void 0) {
		throw new InvalidPatchOperationError(change, 'path doesn\'t exist');
	}

	if(Array.isArray(pointer.target)) {
		pointer.target.splice(parseArrayIndex(pointer.key, change), 1);
	} else {
		delete pointer.target[pointer.key];
	}
}

/**
 * Deserialize dates from JSON
 * @param _
 * @param {*} value ISO date string
 * @returns {*|Date} returns parsed Date, or value if value is not a
 *  valid ISO date string
 */
function dateReviver(_, value) {
	var match;

	if (typeof value === 'string') {
		match = jsonDateRx.exec(value);
		if (match) {
			return new Date(Date.UTC(
				+match[1], +match[2] - 1, +match[3], +match[4], +match[5], +match[6])
			);
		}
	}

	return value;
}

/**
 * Safely parse a string into a number >= 0. Does not check for decimal numbers
 * @param {string} s numeric string
 * @param {object} change the patch operation whose path refers to the
 *  array index being parsed.  Used for exception reporting.
 * @returns {number} number >= 0
 */
function parseArrayIndex (s, change) {
	var index = parseInt(s, 10);
	if (isNaN(index) || index < 0) {
		throw new InvalidPatchOperationError(change, 'invalid array index');
	}
	return index;
}

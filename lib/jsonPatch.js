/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var find = require('./jsonPointer').find;
var deepEquals = require('./deepEquals');

var InvalidPatchOperationError = require('./InvalidPatchOperationError');
var TestFailedError = require('./TestFailedError');

exports.apply = patch;
exports.applyInPlace = patchInPlace;
exports.clone = clone;

var arrayIndexRx = /^(0|[1-9]\d*)$/;
var jsonDateRx = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)(Z|([+\-])(\d{2}):(\d{2}))$/;

var ops = {
	add: add,
	replace: replace,
	remove: remove,
	move: move,
	copy: copy,
	test: test
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
	return patchInPlace(changes, clone(x));
}

function patchInPlace(changes, x) {
	// TODO: Consider throwing if changes is not an array
	if(!Array.isArray(changes)) {
		return x;
	}

	return changes.reduce(function(x, change) {
		var op = ops[change.op];
		if(typeof op === 'function') {
			x = op(x, change);
		} else {
			throw new InvalidPatchOperationError('invalid op ' + change.op);
		}

		return x;
	}, x);
}

/**
 * Create a deep copy of x which must be a value JSON object/array/value
 * @param {object|array|string|number} x object/array/value to clone
 * @returns {object|array|string|number} clone of x
 */
function clone(x) {
	return JSON.parse(JSON.stringify(x), dateReviver);
}

/**
 * Apply an add operation to x
 * @param {object|array} x
 * @param {object} change add operation
 */
function add(x, change) {
	var pointer = find(x, change.path);

	if(notFound(pointer)) {
		throw new InvalidPatchOperationError('path does not exist ' + change.path);
	}

	var val = typeof change.value === 'object'
		? clone(change.value) : change.value;

	// If pointer refers to whole document, replace whole document
	if(pointer.key === void 0) {
		return val;
	}

	_add(pointer, val);
	return x;
}

function _add(pointer, value) {
	var target = pointer.target;
	var index;

	if(Array.isArray(target)) {
		// '-' indicates 'append' to array
		if(pointer.key === '-') {
			target.push(value);
		} else {
			index = parseArrayIndex(pointer.key);
			if(index < 0 || index > target.length) {
				throw new InvalidPatchOperationError('array index out of bounds ' + index);
			}

			target.splice(index, 0, value);
		}
	} else if(isValidObject(target)) {
		target[pointer.key] = value;
	} else {
		throw new InvalidPatchOperationError('target of add must be an object or array ' + pointer.key);
	}
}

/**
 * Apply a replace operation to x
 * @param {object|array} x
 * @param {object} change replace operation
 */
function replace(x, change) {
	var pointer = find(x, change.path);

	if(notFound(pointer) || missingValue(pointer)) {
		throw new InvalidPatchOperationError('path does not exist ' + change.path);
	}

	var value = typeof change.value === 'object'
		? clone(change.value) : change.value;

	// If pointer refers to whole document, replace whole document
	if(pointer.key === void 0) {
		return value;
	}

	var target = pointer.target;

	if(Array.isArray(target)) {
		target[parseArrayIndex(pointer.key)] = value;
	} else {
		target[pointer.key] = value;
	}

	return x;
}

/**
 * Apply a remove operation to x
 * @param {object|array} x
 * @param {object} change remove operation
 */
function remove(x, change) {
	var pointer = find(x, change.path);

	// key must exist for remove
	if(notFound(pointer) || pointer.target[pointer.key] === void 0) {
		throw new InvalidPatchOperationError('path does not exist ' + change.path);
	}

	_remove(pointer);
	return x;
}

function _remove (pointer) {
	var target = pointer.target;

	var removed;
	if (Array.isArray(target)) {
		removed = target.splice(parseArrayIndex(pointer.key), 1);
		return removed[0];

	} else if (isValidObject(target)) {
		removed = target[pointer.key];
		delete target[pointer.key];
		return removed;

	} else {
		throw new InvalidPatchOperationError('target of remove must be an object or array');
	}
}

/**
 * Apply a move operation to x
 * @param {object|array} x
 * @param {object} change move operation
 */
function move(x, change) {
	var pto = find(x, change.path);
	var pfrom = find(x, change.from);

	_add(pto, _remove(pfrom));
	return x;
}

/**
 * Apply a copy operation to x
 * @param {object|array} x
 * @param {object} change copy operation
 */
function copy(x, change) {
	var pto = find(x, change.path, true);
	var pfrom = find(x, change.from);

	_add(pto, clone(pfrom.target[pfrom.key]));
	return x;
}

/**
 * Apply a test operation to x
 * @param {object|array} x
 * @param {object} t test operation
 * @throws {TestFailedError} if the test operation fails
 */

function test(x, t) {
	var pointer = find(x, t.path);

	if(!deepEquals(pointer.target[pointer.key], t.value)) {
		throw new TestFailedError('test failed ' + JSON.stringify(t));
	}

	return x;
}

function notFound (pointer) {
	return pointer === void 0 || (pointer.target == null && pointer.key !== void 0);
}

function missingValue(pointer) {
	return pointer.key !== void 0 && pointer.target[pointer.key] === void 0;
}


/**
 * Return true if x is a non-null object
 * @param {*} x
 * @returns {boolean}
 */
function isValidObject (x) {
	return x !== null && typeof x === 'object';
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
function parseArrayIndex (s) {
	if(!arrayIndexRx.test(s)) {
		throw new InvalidPatchOperationError('invalid array index ' + s);
	}
	return +s;
}

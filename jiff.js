/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var lcs = require('./lib/lcs');
var patch = require('./lib/jsonPatch');
var inverse = require('./lib/inverse');
var jsonPointer = require('./lib/jsonPointer');
var encodeSegment = jsonPointer.encodeSegment;

exports.diff = diff;
exports.patch = patch.apply;
exports.patchInPlace = patch.applyInPlace;
exports.inverse = inverse;
exports.clone = patch.clone;

// Errors
exports.InvalidPatchOperationError = require('./lib/InvalidPatchOperationError');
exports.TestFailedError = require('./lib/TestFailedError');
exports.PatchNotInvertibleError = require('./lib/PatchNotInvertibleError');

/**
 * Compute a JSON Patch representing the differences between a and b.
 * @param {object|array|string|number|null} a
 * @param {object|array|string|number|null} b
 * @param {?function} hasher optional hashing function that will be used to
 *  recognize identical objects, defaults to JSON.stringify
 * @returns {array} JSON Patch such that patch(diff(a, b), a) ~ b
 */
function diff(a, b, hasher) {
	var hash = typeof hasher === 'function' ? hasher : defaultHash;
	var state = { patch: [], hash: hash };

	return appendChanges(a, b, '', state).patch.reverse();
}

function appendChanges(a, b, path, state) {
	if(Array.isArray(a) && Array.isArray(b)) {
		return appendListChanges(a, b, path, state);
	}

	if(isValidObject(a) && isValidObject(b)) {
		return appendObjectChanges(a, b, path, state);
	}

	return appendValueChanges(a, b, path, state);
}

function appendObjectChanges(o1, o2, path, state) {
	var keys = Object.keys(o2);
	var patch = state.patch;
	var i, key;

	for(i=keys.length-1; i>=0; --i) {
		key = keys[i];
		var keyPath = path + '/' + encodeSegment(key);
		if(o1[key] !== void 0) {
			appendChanges(o1[key], o2[key], keyPath, state);
		} else {
			patch.push({ op: 'add', path: keyPath, value: o2[key] });
		}
	}

	keys = Object.keys(o1);
	for(i=keys.length-1; i>=0; --i) {
		key = keys[i];
		if(o2[key] === void 0) {
			var p = path + '/' + encodeSegment(key);
			// remove.value is for monomorphism, not strictly necessary
			patch.push({ op: 'remove', path: p, value: void 0 });
			patch.push({ op: 'test',   path: p, value: o1[key] });
		}
	}

	return state;
}

function appendListChanges(a1, a2, path, state) {
	var a1hash = map(state.hash, a1);
	var a2hash = map(state.hash, a2);

	var lcsMatrix = lcs.compare(a1hash, a2hash);

	return lcsToJsonPatch(a1, a2, path, state, lcsMatrix);
}

/**
 * Transform an lcsMatrix into JSON Patch operations and append
 * them to state.patch, recursing into array elements as necessary
 * @param a1
 * @param a2
 * @param path
 * @param state
 * @param lcsMatrix
 * @returns {*}
 */
function lcsToJsonPatch(a1, a2, path, state, lcsMatrix) {
	return lcs.reduce(function(state, op, i, j) {
		var last, p;
		if (op === lcs.REMOVE) {
			p = path + '/' + j;

			// Coalesce adjacent remove + add into replace
			last = state.patch[state.patch.length-1];
			if(last !== void 0 && last.op === 'add' && last.path === p) {
				last.op = 'replace';
			} else {
				state.patch.push({ op: 'remove', path: p, value: void 0 });
			}
			state.patch.push({ op: 'test', path: p, value: a1[j] });

		} else if (op === lcs.ADD) {
			// See https://tools.ietf.org/html/rfc6902#section-4.1
			// May use either index===length *or* '-' to indicate appending to array
			state.patch.push({ op: 'add', path: path + '/' + j, value: a2[i] });

		} else {
			appendChanges(a1[j], a2[i], path + '/' + j, state);
		}

		return state;

	}, state, lcsMatrix);
}

function appendValueChanges(a, b, path, state) {
	if(a !== b) {
		state.patch.push({ op: 'replace', path: path, value: b });
		state.patch.push({ op: 'test',    path: path, value: a });
	}

	return state;
}

function defaultHash(x) {
	return isValidObject(x) ? JSON.stringify(x) : x;
}

function isValidObject (x) {
	return x !== null && typeof x === 'object';
}

/**
 * Faster than Array.prototype.map
 * @param {function} f
 * @param {Array} a
 * @returns {Array} new Array mapped by f
 */
function map(f, a) {
	var b = new Array(a.length);
	for(var i=0; i< a.length; ++i) {
		b[i] = f(a[i]);
	}
	return b;
}

/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var lcs = require('./lib/lcs');
var patch = require('./lib/jsonPatch');
var jsonPointer = require('./lib/jsonPointer');
var encodeSegment = jsonPointer.encodeSegment;

exports.diff = diff;
exports.patch = patch.apply;
exports.patchInPlace = patch.applyInPlace;
exports.clone = patch.clone;

// Errors
exports.InvalidPatchOperationError = require('./lib/InvalidPatchOperationError');
exports.TestFailedError = require('./lib/TestFailedError');

/**
 * Compute a JSON Patch representing the differences between a and b.
 * @param {object|array|string|number} a
 * @param {object|array|string|number} b
 * @param {function} hasher hashing function that will be used to
 *  recognize identical objects
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
	state = Object.keys(o2).reduceRight(function(state, key) {
		var keyPath = path + '/' + encodeSegment(key);
		if(key in o1) {
			appendChanges(o1[key], o2[key], keyPath, state);
		} else {
			state.patch.push({
				op: 'add',
				path: keyPath,
				value: o2[key]
			});
		}

		return state;
	}, state);

	return Object.keys(o1).reduceRight(function(state, key) {
		if(!(key in o2)) {
			state.patch.push({
				op: 'remove',
				path: path + '/' + encodeSegment(key),
				value: void 0
			});
		}

		return state;
	}, state);
}

function appendListChanges(a1, a2, path, state) {
	var a1hash = a1.map(state.hash);
	var a2hash = a2.map(state.hash);

	var lcsMatrix = lcs.compare(a1hash, a2hash);

	return lcsToJsonPatch(a1, a2, path, state, lcsMatrix);
}

function lcsToJsonPatch(a1, a2, path, state, lcsMatrix) {
	lcs.reduce(function(state, op, i, j) {
		var last, p;
		if (op.type == lcs.REMOVE) {
			p = path + '/' + j;

			// Coalesce adjacent remove + add into replace
			last = state.patch[state.patch.length-1];
			if(last !== void 0 && last.op === 'add' && last.path === p) {
				last.op = 'replace';
			} else {
				state.patch.push({
					op: 'remove',
					path: p,
					value: void 0
				});
			}
		} else if (op.type == lcs.ADD) {
			// See https://tools.ietf.org/html/rfc6902#section-4.1
			// Must use '-' to indicate appending to array
			p = path + '/' + (j === a1.length ? '-' : j);
			state.patch.push({
				op: 'add',
				path: p,
				value: a2[i]
			});
		} else {
			appendChanges(a1[j], a2[i], path + '/' + j, state);
		}

		return state;
	}, state, lcsMatrix);

	return state;
}

function appendValueChanges(a, b, path, state) {
	if(a !== b) {
		state.patch.push({
			op: 'replace',
			path: path,
			value: b
		});
	}

	return state;
}

function defaultHash(x) {
	return x !== null && typeof x === 'object' && 'id' in x
		? x.id : JSON.stringify(x);
}

function isValidObject (x) {
	return x !== null && typeof x === 'object';
}

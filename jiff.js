/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var lcs = require('./lib/lcs');
var jsonPointer = require('./lib/jsonPointer');
var encodeSegment = jsonPointer.encodeSegment;

exports.diff = diff;
exports.patch = patch;
exports.clone = clone;

var jsonDateRx = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)(Z|([+\-])(\d{2}):(\d{2}))$/;

var ops = {
	add: add,
	replace: setValue,
	remove: remove,
	move: move
};

function clone(x) {
	return JSON.parse(JSON.stringify(x), dateReviver);
}

function diff(x1, x2, hasher) {
	var hash = typeof hasher === 'function' ? hasher : defaultHash
	var state = {
		patch: [],
		hash: hash,
		equals: hashEquals(hash)
	};

	return appendChanges(x1, x2, '', state).patch.reverse();
}

function appendChanges(x1, x2, path, state) {
	if(Array.isArray(x2)) {
		return appendListChanges(x1, x2, path, state);
	} else if(x2 && typeof x2 === 'object') {
		return appendObjectChanges(x1, x2, path, state);
	} else {
		return appendValueChanges(x1, x2, path, state);
	}
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
	var lcsMatrix = lcs.compare(a1, a2, state.equals);
	return toPatch(a1, a2, lcsMatrix, path, state);
}

function toPatch(a1, a2, lcsMatrix, path, state) {
	// TODO: Coalesce adjacent remove+add into replace
	lcs.reduce(function(state, op, i, j) {
		var last, p;
		if (op.status == lcs.DELETION) {
			last = state.patch[state.patch.length-1];
			p = path + '/' + j;
			if(last !== void 0 && last.op === 'add' && last.path === p) {
				last.op = 'replace';
			} else {
				state.patch.push({
					op: 'remove',
					path: p,
					value: void 0
				});
			}
		} else if (op.status == lcs.INSERTION) {
			state.patch.push({
				op: 'add',
				path: path + '/' + j,
				value: a2[i]
			});
		} else {
			appendChanges(a1[j], a2[i], path + '/' + j, state);
		}

		return state;
	}, state, lcsMatrix);

	return state;
}

function appendValueChanges(before, after, path, state) {
	if(before !== after) {
		state.patch.push({
			op: 'replace',
			path: path,
			value: after
		});
	}

	return state;
}

function patch(changes, x) {
	return doPatch(ops, changes, x);
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

function move(x, change, shadow) {
	jsonPointer.setValue(x, change.path, jsonPointer.getValue(shadow, change.from));
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

function defaultHash(x, i) {
	return x !== null && typeof x === 'object' && 'id' in x
		? x.id : JSON.stringify(x);
}

function hashEquals(hash) {
	return function(a, b) {
		return hash(a) === hash(b);
	}
}

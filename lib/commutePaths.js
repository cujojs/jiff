var jsonPointer = require('./jsonPointer');

/**
 * commute the patch sequence a,test to test,a
 * @param {object} a patch operation
 * @param {object} b patch operation
 */
module.exports = function commutePaths(a, b) {
	// TODO: cases for special paths: '' and '/'

	// If neither operation will affect array indexes, simple swap
	if((a.op === 'replace' || a.op === 'test')
		&& (b.op === 'replace' || b.op === 'test')) {
		return [b, a];
	}

	var left = jsonPointer.parse(a.path);
	var right = jsonPointer.parse(b.path);
	var prefix = getCommonPathPrefix(left, right);

	// FIXME: This doesn't work when the document is an array
	if(prefix.length === 0) {
		// Paths share no common ancestor, simple swap
		return [b, a];
	}

	if(right.length === left.length) {
		return commuteSiblings(a, left, b, right);
	}

	if (right.length < left.length) {
		// left is longer, commute by "moving" it to the right
		left = commuteAncestor(b, right, a, left, -1);
		a.path = jsonPointer.absolute(jsonPointer.join(left));
	} else {
		// right is longer, commute by "moving" it to the left
		right = commuteAncestor(a, left, b, right, 1);
		b.path = jsonPointer.absolute(jsonPointer.join(right));
	}

	return [b, a];
};

function commuteSiblings(l, lpath, r, rpath) {

	var target = lpath.length-1;
	var lseg = lpath[target];

	// TODO: This check is dangerous, need actual document context to
	// know if this is an array index or not! :(
	if(!arrayIndexRx.test(lseg)) {
		return rpath;
	}

	// TODO: Check for valid rbase arrayIndex?
	// Only safe if we know it's an array, which we don't! See above
	// But for now, assume we do
	var lindex = +lseg;
	var rindex = parseArrayIndex(rpath[target]);
	var commuted;

	if(lindex === rindex) {
		// If the "later" op is a remove, but refers to the same index as the
		// "earlier" op, that seems like a conflict.
		// For example, how do you commute:
		// add /8 and remove /8, replace /8 and remove /8, etc.
		// Basically any pair that
		if(r.op === 'remove' && l.op !== 'remove') {
			// Can't commute?
			throw new TypeError('patches cannot be commuted');
		}
	} else if(lindex < rindex) {
		// Adjust right path
		commuted = rpath.slice();
		if(l.op === 'add' || l.op === 'copy') {
			commuted[target] = Math.max(0, rindex - 1);
			r.path = jsonPointer.absolute(jsonPointer.join(commuted));
		} else if(l.op === 'remove') {
			commuted[target] = rindex + 1;
			r.path = jsonPointer.absolute(jsonPointer.join(commuted));
		}
	} else {
		// Adjust left path
		commuted = lpath.slice();
		if(r.op === 'add' || r.op === 'copy') {
			commuted[target] = lindex + 1;
			l.path = jsonPointer.absolute(jsonPointer.join(commuted));
		} else if(r.op === 'remove') {
			commuted[target] = Math.max(0, lindex - 1);
			l.path = jsonPointer.absolute(jsonPointer.join(commuted));
		}
	}

	return [r, l];
}

function commuteAncestor(l, lpath, r, rpath, direction) {
	// rpath is longer or same length

	var target = lpath.length-1;
	var lseg = lpath[target];

	// TODO: This check is dangerous, need actual document context to
	// know if this is an array index or not! :(
	if(!arrayIndexRx.test(lseg)) {
		return rpath;
	}

	// TODO: Check for valid rbase arrayIndex?
	// Only safe if we know it's an array, which we don't! See above
	// But for now, assume we do
	var lindex = +lseg;
	var rindex = parseArrayIndex(rpath[target]);

	// Copy rpath, then adjust its array index
	var rc = rpath.slice();

	if(lindex > rindex) {
		return rc;
	}

	if(l.op === 'add' || l.op === 'copy') {
		rc[target] = Math.max(0, rindex - direction);
	} else if(l.op === 'remove') {
		rc[target] = Math.max(0, rindex + direction);
	}

	return rc;
}

function getCommonPathPrefix(p1, p2) {
	var l = Math.min(p1.length, p2.length);
	var i = 0;
	while(i < l && p1[i] === p2[i]) {
		++i
	}

	return p1.slice(0, i);
}

var arrayIndexRx = /^(0|[1-9]\d*)$/;

/**
 * Safely parse a string into a number >= 0. Does not check for decimal numbers
 * @param {string} s numeric string
 * @returns {number} number >= 0
 */
function parseArrayIndex (s) {
	if(!arrayIndexRx.test(s)) {
		throw new InvalidPatchOperationError('invalid array index ' + s);
	}
	return +s;
}

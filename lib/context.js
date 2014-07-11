exports.findPosition = findPosition;
exports.matchContext = matchContext;
exports.makeContextFinder = makeContextFinder;
exports.makeContext = makeContext;

/**
 * Creates a findContext function that expects a context
 * { before: [...], after: [...] } containing some number of items before
 * and after the change.  Uses the provided equals function to compare
 * array itesm and find the best fit position in the array to
 * apply the patch.  Uses a similar algorithm to GNU patch.
 * @param {function(a:*, b:*):boolean} equals return truthy if a and b are equal
 * @returns {Function} a findContext function that can be passed to jiff.patch
 */
function makeContextFinder(equals) {
	return function(index, array, context) {
		return findPosition(equals, index, array, context);
	};
}

/**
 * Creates a makeContext function that will generate patch contexts
 * { before: [...], after: [...] } containing `size` number of items
 * before and after the change.
 * @param {number} size max number of items before/after the change to include
 * @returns {Function} a makeContext function that can be passed to jiff.diff
 */
function makeContext(size) {
	return function (index, array) {
		return {
			before: array.slice(Math.max(0, index - size), index),
			after: array.slice(Math.min(array.length, index + 1), index + size + 1)
		};
	};
}

// TODO: Include removed items in the patch context when patch is a remove

function findPosition (equals, start, array, context) {
	var index;
	var before = context.before;
	var blen = before.length;
	var bmax = 0;
	var after = context.after;
	var amax = after.length;

	while(amax > 0 || bmax < blen) {
		index = findPositionWith(equals, array, start,
			before.slice(bmax),
			after.slice(0, amax));

		if(index >= 0) {
			return index;
		}

		bmax = Math.min(blen, bmax+1);
		amax = Math.max(0, amax-1);
	}

	return start;
}

function findPositionWith(equals, array, start, before, after, patch) {
	var blen = before.length;
	var b = start-blen;

	var found = false;
	var i = b;

	while(i >= 0 && !found) {
		found = matchContext(equals, array, i, i+blen+1, before, after);
		if(found) {
			return i + blen;
		}

		--i;
	}

	i = start;
	while(i < array.length && !found) {
		found = matchContext(equals, array, i-blen, i+1, before, after);
		if(found) {
			return i;
		}

		++i;
	}

	return -1;
}

function matchContext(equals, array, b, a, before, after) {
	var i, l;
	for(i=0, l=before.length; i<l; ++i) {
		if(!equals(before[i], array[b+i])) {
			return false;
		}
	}

	for(i=0, l=after.length; i<l; ++i) {
		if(!equals(after[i], array[a+i])) {
			return false;
		}
	}

	return true;
}

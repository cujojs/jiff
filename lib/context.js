exports.findPosition = findPosition;
exports.matchContext = matchContext;
exports.makeContextFinder = makeContextFinder;
exports.makeContext = makeContext;

function makeContextFinder(equals) {
	return function(index, array, context) {
		return findPosition(equals, index, array, context);
	};
}

function makeContext(size) {
	return function (index, array) {
		return {
			before: array.slice(Math.max(0, index - size), index),
			after: array.slice(Math.min(array.length, index), index + size)
		};
	};
}

function findPosition (equals, start, array, context) {
	var index;
	var before = context.before;
	var blen = before.length;
	var bmax = 0;
	var after = context.after;
	var amax = after.length;

	while(amax > 0 || bmax < blen) {
		index = findPositionWith(equals, array,
			before.slice(bmax),
			after.slice(0, amax), start);

		if(index >= 0) {
			return index;
		}

		bmax = Math.min(blen, bmax+1);
		amax = Math.max(0, amax-1);
	}

	return start;
}

function findPositionWith(equals, array, before, after, start) {
	var blen = before.length;
	var b = start-blen;

	var bspan = blen;
	var found = false;
	var i = b;

	while(i >= 0 && !found) {
		found = matchContext(equals, array, i, i+blen, before, after);
		if(found) {
			return i + blen;
		}

		--i;
	}

	i = start;
	while(i < array.length && !found) {
		found = matchContext(equals, array, i-bspan, i, before, after);
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

exports.findPosition = findPosition;
exports.matchContext = matchContext;

function findPosition(equals, x, context, start) {
	var index;
	var before = context.before;
	var blen = before.length;
	var bmax = 0;
	var after = context.after;
	var amax = after.length;

	while(amax > 0 || bmax < blen) {
		index = findPositionWith(equals, x,
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

function findPositionWith(equals, x, before, after, start) {
	var blen = before.length;
	var b = start-blen;

	var bspan = blen;
	var found = false;
	var i = b;

	while(i >= 0 && !found) {
		found = matchContext(equals, x, i, i+blen, before, after);
		if(found) {
			return i + blen;
		}

		--i;
	}

	i = start;
	while(i < x.length && !found) {
		found = matchContext(equals, x, i-bspan, i, before, after);
		if(found) {
			return i;
		}

		++i;
	}

	return -1;
}

function matchContext(equals, x, b, a, before, after) {
	var i, l;
	for(i=0, l=before.length; i<l; ++i) {
		if(!equals(before[i], x[b+i])) {
			return false;
		}
	}

	for(i=0, l=after.length; i<l; ++i) {
		if(!equals(after[i], x[a+i])) {
			return false;
		}
	}

	return true;
}

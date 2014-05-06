var PatchNotInvertibleError = require('./PatchNotInvertibleError');

var inverses = {
	test: invertTest,
	add: invertAdd,
	replace: invertReplace,
	remove: invertRemove,
	move: invertMove,
	copy: invertCopy
};

module.exports = inverse;

function inverse(p) {
	var pr = [];
	var c, i, inverse, skip;
	for(i = p.length-1; i>= 0; i -= skip) {
		c = p[i];
		inverse = inverses[c.op];
		if(typeof inverse === 'function') {
			skip = inverse(pr, c, i, p);
		}
	}

	return pr;
}

function invertTest(pr, c) {
	pr.push(c);
	return 1;
}

function invertAdd(pr, c) {
	pr.push({
		op: 'test',
		path: c.path,
		value: c.value
	});

	pr.push({
		op: 'remove',
		path: c.path
	});

	return 1;
}

function invertReplace(pr, c, i, p) {
	var prev = p[i-1];
	if(prev === void 0 || prev.op !== 'test' || prev.path !== c.path) {
		throw new PatchNotInvertibleError('cannot invert replace w/o test');
	}

	pr.push({
		op: 'test',
		path: prev.path,
		value: c.value
	});

	pr.push({
		op: 'replace',
		path: prev.path,
		value: prev.value
	});

	return 2;
}

function invertRemove(pr, c, i, p) {
	var prev = p[i-1];
	if(prev === void 0 || prev.op !== 'test' || prev.path !== c.path) {
		throw new PatchNotInvertibleError('cannot invert remove w/o test');
	}

	pr.push({
		op: 'add',
		path: prev.path,
		value: prev.value
	});

	return 2;
}

function invertMove(pr, c) {
	pr.push({
		op: 'move',
		path: c.from,
		from: c.path
	});

	return 1;
}

function invertCopy(pr, c) {
	// See https://github.com/cujojs/jiff/issues/9
	// This needs more thought. We may have to extend/amend JSON Patch.
	// At first glance, this seems like it should just be a remove.
	// However, that's not correct.  It violates the involution:
	// invert(invert(p)) ~= p.  For example:
	// invert(copy) -> remove
	// invert(remove) -> add (DOH! this should be copy!)
	throw new PatchNotInvertibleError('cannot invert copy');
}

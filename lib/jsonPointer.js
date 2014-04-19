/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

exports.find = find;
exports.getValue = getValue;
exports.setValue = setValue;
exports.add = add;
exports.remove = remove;
exports.encodeSegment = encodeSegment;
exports.decodeSegment = decodeSegment;

// http://tools.ietf.org/html/rfc6901#page-2
var separator = '/';
var separatorRx = /\//g;
var encodedSeparator = '~1';
var encodedSeparatorRx = /~1/g;

var escapeChar = '~';
var escapeRx = /~/g;
var encodedEscape = '~0';
var encodedEscapeRx = /~0/g;

function find(x, p) {
	if(!p || p === '/') {
		return;
	}

	p = split(p);

	var i, len = p.length;

	if(len === 0) {
		return;
	}

	for(i=0, len=len-1; i<len; i++) {
		x = x[decodeSegment(p[i])];
	}

	return { target: x, key: decodeSegment(p[len]) };
}

function getValue(x, path, defaultValue) {
	var pointer = find(x, path);

	return pointer ? pointer.target[pointer.key] : defaultValue;
}

function setValue(x, path, value) {
	var pointer = find(x, path);
	if(pointer) {
		pointer.target[pointer.key] = value;
	}
}

function add(x, path, value) {
	var pointer = find(x, path);
	if(pointer) {
		if(Array.isArray(pointer.target)) {
			pointer.target.splice(parseInt(pointer.key, 10), 0, value);
		}
		pointer.target[pointer.key] = value;
	}
}

function remove(x, path) {
	var pointer = find(x, path);
	if(pointer) {
		if(Array.isArray(pointer.target)) {
			pointer.target.splice(parseInt(pointer.key, 10), 1);
		} else {
			delete pointer.target[pointer.key];
		}
	}
}

function decodeSegment(s) {
	// See: http://tools.ietf.org/html/rfc6901#page-3
	return s.replace(encodedSeparatorRx, separator).replace(encodedEscapeRx, escapeChar);
}

function encodeSegment(s) {
	return s.replace(escapeRx, encodedEscape).replace(separatorRx, encodedSeparator);
}

function split(path) {
	if(path[0] === separator) {
		path = path.slice(1);
	}

	return path.split(separator);
}


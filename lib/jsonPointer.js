/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

exports.find = find;
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

/**
 * Find the parent of the specified path in x and return a descriptor
 * containing the parent and a key
 * @param {object|array} x object or array in which to search
 * @param {string} path JSON Pointer string (encoded)
 * @returns {{target:object|array|number|string, key:string}|undefined}
 */
function find(x, path) {
	if(x == null || path === '/' || path === '' || typeof path !== 'string') {
		return;
	}

	path = split(path);

	if(path.length === 0) {
		return;
	}

	var i = 0;
	var len= path.length-1;

	for(; i<len; ++i) {
		x = x[decodeSegment(path[i])];
		if(x == null) {
			return;
		}
	}

	return { target: x, key: decodeSegment(path[len]) };
}

/**
 * Decode a JSON Pointer path segment
 * @see http://tools.ietf.org/html/rfc6901#page-3
 * @param {string} s encoded segment
 * @returns {string} decoded segment
 */
function decodeSegment(s) {
	// See: http://tools.ietf.org/html/rfc6901#page-3
	return s.replace(encodedSeparatorRx, separator).replace(encodedEscapeRx, escapeChar);
}

/**
 * Encode a JSON Pointer path segment
 * @see http://tools.ietf.org/html/rfc6901#page-3
 * @param {string} s decoded segment
 * @returns {string} encoded segment
 */
function encodeSegment(s) {
	return s.replace(escapeRx, encodedEscape).replace(separatorRx, encodedSeparator);
}

/**
 * Split a JSON Pointer into path segments
 * @param {string} path JSON Pointer string (encoded)
 * @returns {array}
 */
function split(path) {
	if(path[0] === separator) {
		path = path.slice(1);
	}

	return path.split(separator);
}

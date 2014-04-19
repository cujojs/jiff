/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

exports.compare = compare;
exports.reduce = reduce;

var REMOVE, RIGHT, ADD, DOWN, SKIP, DIAGONAL;

REMOVE = RIGHT = -1;
ADD = DOWN = 1;
SKIP = DIAGONAL = 0;

exports.DELETION = REMOVE;
exports.RIGHT = RIGHT;
exports.INSERTION = ADD;
exports.DOWN = DOWN;
exports.EQUAL = SKIP;
exports.DIAGONAL = DIAGONAL;

/**
 * Create an lcs comparison matrix describing the differences
 * between two array-like sequences
 * @param {array} a array-like
 * @param {array b array-like
 * @param {function} equals function to compare items from a and b
 *  for equality. Must return true if two items are the same, false otherwise.
 * @returns {array<array>} 2d matrix
 */
function compare(a, b, equals) {
	var cols = a.length;
	var rows = b.length;

	var matrix = createMatrix(cols, rows);

	for (var j = cols - 1; j >= 0; j--) {
		for (var i = rows - 1; i >= 0; i--) {
			backtrack(matrix, a, j, b, i, equals);
		}
	}

	return matrix;
}

/**
 * Reduce a set of lcs changes previously created using compare
 * @param {function(result:*, change:object), i:number, j:number} f reducer function
 * @param {*} r initial value
 * @param {array<array>} matrix 2d lcs matrix created by compare()
 * @returns {*}
 */
function reduce(f, r, matrix) {
	var i = 0;
	var j = 0;
	var l = matrix.length;
	var op;

	while(i < l) {
		op = matrix[i][j];
		r = f(r, op, i, j);

		switch(op.status) {
			case DIAGONAL:
				i += 1;
				j += 1;
				break;
			case RIGHT:
				j += 1;
				break;
			case DOWN:
				i += 1;
				break;
		}
	}

	return r;
}

function backtrack(matrix, reference, j, input, i, equals) {
	if (equals(reference[j], input[i])) {
		matrix[i][j] = { value: matrix[i + 1][j + 1].value, status: DIAGONAL };
	} else if (matrix[i][j + 1].value < matrix[i + 1][j].value) {
		matrix[i][j] = { value: matrix[i][j + 1].value + 1, status: RIGHT };
	} else {
		matrix[i][j] = { value: matrix[i + 1][j].value + 1, status: DOWN };
	}
}

function createMatrix (cols, rows) {
	var m = [], i, j;

	// Fill the last row
	for (j = cols; j >= 0; j--) {
		m[rows] = m[rows] || [];
		m[rows][j] = { value: cols - j, status: RIGHT };
	}

	// Fill the last col
	for (i = rows; i >= 0; i--) {
		m[i] = m[i] || [];
		m[i][cols] = { value: rows - i, status: DOWN };
	}

	// Fill the last cell
	m[rows][cols] = { value: 0, status: DIAGONAL };

	return m;
}

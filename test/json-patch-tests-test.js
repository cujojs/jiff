var buster = require('buster');
var assert = buster.referee.assert;
var deepEquals = require('../lib/deepEquals');

var jsonPatch = require('../lib/jsonPatch');

var specTests = require('json-patch-test-suite/spec_tests.json');
var tests = require('json-patch-test-suite/tests.json');

buster.testCase('json-patch-tests', {
	'spec_tests.json': jsonToBuster(specTests),
	'tests.json': jsonToBuster(tests)
});

/**
 * Converts json-based tests in json-patch-tests to buster testCase objects
 * @param {array} tests
 * @returns {object}
 */
function jsonToBuster(tests) {
	return tests.reduce(function(testCase, test) {
		if(test.disabled) {
			testCase['//' + test.comment] = noop;
		} else {
			var doc = test.doc;
			var patch = test.patch;
			if(test.error) {
				testCase[test.comment] = function() {
					assert.exception(function() {
						jsonPatch.apply(patch, doc);
					});
				}
			} else if(test.expected) {
				testCase[test.comment] = function() {
					assert(deepEquals(test.expected, jsonPatch.apply(patch, doc)));
				}
			}
		}

		return testCase;
	}, {});
}

function noop() {}

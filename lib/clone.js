var jsonDateRx = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)(Z|([+\-])(\d{2}):(\d{2}))$/;

/**
 * Create a deep copy of x which must be a value JSON object/array/value
 * @param {object|array|string|number|null} x object/array/value to clone
 * @returns {object|array|string|number|null} clone of x
 */
module.exports = function clone(x) {
	return x !== null && typeof x === 'object'
		? JSON.parse(JSON.stringify(x), dateReviver)
		: x;
};

/**
 * Deserialize dates from JSON
 * @param _
 * @param {*} value ISO date string
 * @returns {*|Date} returns parsed Date, or value if value is not a
 *  valid ISO date string
 */
function dateReviver(_, value) {
	var match;

	if (typeof value === 'string') {
		match = jsonDateRx.exec(value);
		if (match) {
			return new Date(Date.UTC(
					+match[1], +match[2] - 1, +match[3], +match[4], +match[5], +match[6])
			);
		}
	}

	return value;
}
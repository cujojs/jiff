module.exports = InvalidPatchOperationError;

function InvalidPatchOperationError(op, message) {
	Error.call(this);
	this.name = this.constructor.name;
	this.message = message + ' ' + JSON.stringify(op);
	if(typeof Error.captureStackTrace === 'function') {
		Error.captureStackTrace(this, this.constructor);
	}
}

InvalidPatchOperationError.prototype = Object.create(Error.prototype);
InvalidPatchOperationError.prototype.constructor = InvalidPatchOperationError;
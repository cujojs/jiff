declare module "jiff" {
	export type JSONPatch = {
		op: "add" | "remove" | "replace" | "move" | "copy" | "test";
		path: string;
		value?: any;
		from?: string;
	}[];

	export interface DiffOptions {
		/** used to hash array items in order to recognize identical objects, defaults to JSON.stringify */
		hash?: (value: any) => string | number;
		/** used to generate patch context. If not provided, context will not be generated */
		makeContext?: (index: number, array: any[]) => any;
		invertible?: boolean;
	}

	export interface PatchOptions {
		/** function used adjust array indexes for smarty/fuzzy patching, for patches containing context */
		findContext?: (index: number, array: any[]) => any;
	}

	var jiff: {
		/**
		 * Create a deep copy of x which must be a legal JSON object/array/value
		 * @param {object|array|string|number|null} x object/array/value to clone
		 * @returns {object|array|string|number|null} clone of x
		 */
		clone: (x: any) => any;
		/**
		 * Compute a JSON Patch representing the differences between a and b.
		 * @param {object|array|string|number|null} a
		 * @param {object|array|string|number|null} b
		 * @param {?function|?DiffOptions} options if a function, see options.hash
		 * @returns {JSONPatch} JSON Patch such that patch(diff(a, b), a) ~ b
		 */
		diff: (a: any, b: any, options?: DiffOptions) => JSONPatch;
		inverse: (patch: JSONPatch) => JSONPatch;
		/**
		 * Apply the supplied JSON Patch to x
		 * @param {JSONPatch} changes JSON Patch
		 * @param {object|array|string|number} x object/array/value to patch
		 * @param {PatchOptions} options
		 *
		 * @returns {object|array|string|number} patched version of x. If x is
		 *  an array or object, it will be mutated and returned. Otherwise, if
		 *  x is a value, the new value will be returned.
		 */
		patch: (changes: JSONPatch, x: any, options?: PatchOptions) => any;
		patchInPlace: (patch: JSONPatch, a: any) => void;
	};

	export default jiff;
}

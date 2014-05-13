# JSON Diff and Patch

Jiff is an implementation of [JSON Patch RFC6902](https://tools.ietf.org/html/rfc6902), plus a Diff implementation that generates compliant patches.

It handles nuances of the RFC, such as:

1. Checking for invalid paths in all operations
1. Allowing `add` to behave like `replace` for existing paths ([See bullet 3](https://tools.ietf.org/html/rfc6902#section-4.1))
1. Appending to arrays when path ends with `"/-"` ([See bullet 6](https://tools.ietf.org/html/rfc6902#section-4.1))
1. Validating array indices obey [JSON Pointer rules](http://tools.ietf.org/html/rfc6901#section-4)
1. Allowing `add` and `replace` to replace the whole document when path is `""`
1. Deep comparisons for the `test` operation regardless of object key order (eg, if JSON documents were serialized using different key ordering algorithms)

## Get it

`npm install --save jiff`

`bower install --save jiff`

## Example

```js
var a = [
	{ name: 'a' },
	{ name: 'b' },
	{ name: 'c' },
]

var b = a.slice();
b.splice(1, 1);
b.push({ name: 'd' });

// Generate diff (ie JSON Patch) from a to b
var patch = jiff.diff(a, b);

// [{"op":"add","path":"/3","value":{"name":"d"}},{"op":"remove","path":"/1"}]
console.log(JSON.stringify(patch));

var patched = jiff.patch(patch, a);

// [{"name":"a"},{"name":"c"},{"name":"d"}]
console.log(JSON.stringify(patched));
```

## API

### patch

```js
var b = jiff.patch(patch, a);
```

Given an rfc6902 JSON Patch, apply it to `a` and return a new patched JSON object/array/value.  Patching is atomic, and is performed on a clone of `a`.  Thus, if patching fails mid-patch, `a` will still be in a consistent state.

Throws [InvalidPatchOperationError](#invalidpatchoperationerror) and [TestFailedError](#testfailederror).

### patchInPlace

```js
a = jiff.patchInPlace(patch, a);
```

Given an rfc6902 JSON Patch, apply it directly to `a`, *mutating `a`*.

Note that this is an opt-in violation of the patching algorithm outlined in rfc6902.  It may provide some performance benefits as it avoids creating a new clone of `a` before patching.

However, if patching fails mid-patch, `a` will be left in an inconsistent state.

Throws [InvalidPatchOperationError](#invalidpatchoperationerror) and [TestFailedError](#testfailederror).

### diff

```js
var patch = jiff.diff(a, b [, hashFunction]);
```

Computes and returns a JSON Patch from `a` to `b`: `a` and `b` must be valid JSON objects/arrays/values of the same type. If `patch` is applied to `a`, it will yield `b`.

If provided, the optional `hashFunction` will be used to recognize when two objects are the same.  If not provided, `JSON.stringify` will be used.

While jiff's patch algorithm handles all the JSON Patch operations required by rfc6902, the diff algorithm currently does not generate `move`, or `copy` operations, only `add`, `remove`, and `replace`.

### inverse

```js
var patchInverse = jiff.inverse(patch);
```

Compute an inverse patch.  Applying the inverse of a patch will undo the effect of the original.

Due to the current JSON Patch format defined in rfc6902, not all patches can be inverted.  To be invertible, a patch must have the following characteristics:

1. Each `remove` and `replace` operation must be preceded by a `test` operation that verifies the `value` at the `path` being removed/replaced.
2. The patch must *not* contain any `copy` operations.  Read [this discussion](https://github.com/cujojs/jiff/issues/9) to understand why `copy` operations are not (yet) invertible. You can achieve the same effect by using `add` instead of `copy`, albeit potentially at the cost of data size.

### clone

```js
var b = jiff.clone(a);
```

Creates a deep copy of `a`, which must be a valid JSON object/array/value.

## Experimental API

### jiff/lib/commute

```js
var commute = require('jiff/lib/commute');
var [p2c, p1c] = commute(p1, p2);
```

Given two patches `p1` and `p2`, which are intended to be applied in the order `p1` then `p2`, transform them so that they can be safely applied in the order `p2c` and then `p1c`.
 
 Commutation is currently *highly experimental*.  It works for patch operations whose path refers to a common array ancestor by transforming array indices.  Operations that share a common object ancestor are simply swapped for now, which is likely not the right thing in most cases!
 
 Commutation does attempt to detect operations that cannot be commuted, and in such cases, will throw a `TypeError`.

## Errors

### InvalidPatchOperationError

Thrown when any invalid patch operation is encountered.  Invalid patch operations are outlined in [sections 4.x](https://tools.ietf.org/html/rfc6902#section-4) [and 5](https://tools.ietf.org/html/rfc6902#section-5) in rfc6902.  For example: non-existent path in a remove operation, array path index out of bounds, etc.

### TestFailedError

Thrown when a [`test` operation](https://tools.ietf.org/html/rfc6902#section-4.6) fails.

## License

MIT

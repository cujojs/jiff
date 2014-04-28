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
console.log(JSON.stringify(patched);
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

### clone

```js
var b = jiff.clone(a);
```

Creates a deep copy of `a`, which must be a valid JSON object/array/value.

### InvalidPatchOperationError

Thrown when any invalid patch operation is encountered.  Invalid patch operations are outlined in [sections 4.x](https://tools.ietf.org/html/rfc6902#section-4) [and 5](https://tools.ietf.org/html/rfc6902#section-5) in rfc6902.  For example: non-existent path in a remove operation, array path index out of bounds, etc.

### TestFailedError

Thrown when a [`test` operation](https://tools.ietf.org/html/rfc6902#section-4.6) fails.

## License

MIT
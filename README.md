# JSON Diff and Patch

Jiff is an implementation of [JSON Patch RFC6902](https://tools.ietf.org/html/rfc6902), plus a Diff implementation that generates compliant patches.

## Get it

`npm install --save jiff`

`bower install --save jiff`

## API

### patch

```js
var b = jiff.patch(patch, a);
```

Given an rfc6902 JSON Patch, apply it to `a` and return a new patched JSON object/array/value.  Patching is atomic, and is performed on a clone of `a`.  Thus, if patching fails mid-patch, `a` will still be in a consistent state.

### patchInPlace

```js
var b = jiff.patchInPlace(patch, a);
```

Given an rfc6902 JSON Patch, apply it directly to `a`, *mutating `a`*.

Note that this is an opt-in violation of the patching algorithm outlined in rfc6902.  It may provide some performance benefits as it avoids creating a new clone of `a` before patching.

However, if patching fails mid-patch, `a` will be left in an inconsistent state.

### diff

```js
var patch = jiff.diff(a, b [, hashFunction]);
```

Computes and returns a JSON Patch from `a` to `b`: `a` and `b` must be valid JSON objects/arrays/values of the same type. If `patch` is applied to `a`, it will yield `b`.

If provided, the optional `hashFunction` will be used to recognize when two objects are the same.  If not provided, `JSON.stringify` will be used.

The diff algorithm does not generate `move`, or `copy` operations, only `add`, `remove`, and `replace`.

### clone

```js
var b = jiff.clone(a);
```

Creates a deep copy of `a`, which must be a valid JSON object/array/value.

### InvalidPatchOperationError

When any invalid patch operation is encountered, jiff will throw an `InvalidPatchOperationError`.  Invalid patch operations are outlined in sections 4.x in RFC 6902.

## License

MIT
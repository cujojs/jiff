# JSON Diff and Patch

Jiff is an implementation of [JSON Patch RFC6902](https://tools.ietf.org/html/rfc6902), plus a Diff implementation that generates compliant patches.

It also provides advanced and [experimental APIs](#experimentalapis) based on patch algebra, such as [patch inverses](#inverse) ("reverse" patches), [commutation](#jifflibcommute) (patch reordering), and even [rebasing](#jifflibrebase) (moving patches from one history to another).

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
var b = jiff.patch(patch, a [, options]);
```

Given an rfc6902 JSON Patch, apply it to `a` and return a new patched JSON object/array/value.  Patching is atomic, and is performed on a clone of `a`.  Thus, if patching fails mid-patch, `a` will still be in a consistent state.

* `options`
    * `options.findContext : function(index, array, context) -> number`: **Experimental** function to be called before each change to an array.  It is passed the array and index of the change, *and* a patch context (see [`options.makeContext` below](#diff)).  It should return an adjusted index at which the change will actually be applied. This allows for smart patching of arrays that may have changed since the patch was created.

Throws [InvalidPatchOperationError](#invalidpatchoperationerror) and [TestFailedError](#testfailederror).

### patchInPlace

```js
a = jiff.patchInPlace(patch, a [, options]);
```

Given an rfc6902 JSON Patch, apply it directly to `a`, *mutating `a`*.

Note that this is an opt-in violation of the patching algorithm outlined in rfc6902.  It may provide some performance benefits as it avoids creating a new clone of `a` before patching.

However, if patching fails mid-patch, `a` will be left in an inconsistent state.

Throws [InvalidPatchOperationError](#invalidpatchoperationerror) and [TestFailedError](#testfailederror).

### diff

```js
var patch = jiff.diff(a, b [, hashFunction | options]);
```

Computes and returns a JSON Patch from `a` to `b`: `a` and `b` must be valid JSON objects/arrays/values. If `patch` is applied to `a`, it will yield `b`.

The optional third parameter can be *either* an `options` object (preferably) or a function (deprecated: allowed backward compatibility).

* `options`:
	* `options.hash : function(x) -> string|number`: used to recognize when two objects are the same.  If not provided, `JSON.stringify` will be used for objects and arrays, and simply returns `x` for all other primitive values.
	* `options.makeContext : function(index, array) -> *`: **Experimental** function that will be called for each item added or removed from an array.  It can return *any* legal JSON value or undefined, which if not `null` or undefined, will be fed directly to the `findContext` function provided to [`jiff.patch`](#patch).
	* `options.invertible : boolean`: by default, jiff generates patches containing extra `test` operations to ensure they are invertible via [`jiff.inverse`](#inverse).  When `options.invertible === false` will omit the extra `test` operations. This will result in smaller patches, but they will not be invertible.
* `hashFunction(x) -> string|number`: same as `options.hash` above

While jiff's patch algorithm handles all the JSON Patch operations required by rfc6902, the diff algorithm currently does not generate `move`, or `copy` operations, only `add`, `remove`, and `replace`.

### inverse

```js
var patchInverse = jiff.inverse(patch);
```

Compute an inverse patch.  Applying the inverse of a patch will undo the effect of the original.

Due to the current JSON Patch format defined in rfc6902, not all patches can be inverted.  To be invertible, a patch must have the following characteristics:

1. Each `remove` and `replace` operation must be preceded by a `test` operation that verifies the `value` at the `path` being removed/replaced.
2. The patch must *not* contain any `copy` operations.  Read [this discussion](https://github.com/cujojs/jiff/issues/9) to understand why `copy` operations are not (yet) invertible. You can achieve the same effect by using `add` instead of `copy`, albeit potentially at the cost of increased patch size.

### clone

```js
var b = jiff.clone(a);
```

Creates a deep copy of `a`, which must be a valid JSON object/array/value.

**NOTE:** In jiff &lt;= 0.6.x, `jiff.clone` incorrectly caused some ISO Date-formatted strings (eg `"2014-12-03T11:40:16.816Z"`) to be turned into `Date` objects.  Thus, a clone *might not end up as an exact copy*.

As of 0.7.0 `jiff.clone` creates exact copies.

If you have code that depended on that hidden deserialization, *it will break*.  Date deserialization is now the responsibility of the party who parsed the JSON string from which the original object/array/etc. (ie, the one passed to `jiff.clone`) was created.

### Patch context

As of v0.2, `jiff.diff` and `jiff.patch` support [patch contexts](http://en.wikipedia.org/wiki/Diff#Context_format), an extra bit of information carried with each patch operation.  Patch contexts allow smarter patching, especially in the case of arrays, where items may have moved and thus their indices changed.

Using patch contexts can greatly improve patch accuracy for arrays, at the cost of increasing the size of patches.

Patch contexts are entirely opt-in. To use them, you must provide a pair of closely related functions: `makeContext` and `findContext`.  An API for creating default `makeContext` and `findContext` functions is provided in [`jiff/lib/context`](#jifflibcontext), or you can implement your own.

When you supply the optional `makeContext` function to `jiff.diff`, it will be used to generated a context for each change to an array.

Likewise, when you supply the optional `findContext` function to `jiff.patch` (or `jiff.patchInPlace`), it will be used to find adjusted array indices where patches should actually be applied.

The context is opaque, and jiff itself will not attempt to inspect or interpret it: `jiff.diff` will simply add whatever is returned by `makeContext` to patch operations, and `jiff.patch` will simply hand it to `findContext` when it sees a context in a patch operation.


## Experimental APIs

These APIs are still considered experimental, signatures may change.

### jiff/lib/context

```js
var context = require('jiff/lib/context');

// Create a makeContext function that can be passed to jiff.diff
var makeContext = context.makeContext(size);

// Create a findContext function that can be passed to jiff.patch
var findContext = context.makeContextFinder(equals);
```

Provides simple, but effective default implementations of `makeContext` and `findContext` functions that can be passed to `jiff.diff` and `jiff.patch` to take advantage of smarter array patching.

`context.makeContext(size)` *returns* a function that can be passed as `options.makeContext` to `jiff.diff`.
	* `size: number` is the number of array items before and after each change to include in the patch.

`context.makeContextFinder(equals)` *returns* a function that can be passed as `options.findContext` to `jiff.patch`.
	* `equals: function(a, b) -> boolean` a function to compare two array items, must return truthy when `a` and `b` are equal, falsy otherwise.

### jiff/lib/rebase

```js
var rebase = require('jiff/lib/rebase');
var patchRebased = rebase(patchHistory, patch);
```

Yes, this is `git rebase` for JSON Patch.

Given a patchHistory (Array of patches), and a single patch rooted at the same starting document context, rebase patch onto patchHistory, so that it may be applied after patchHistory.

Rebasing is dependent on [commutation](#jifflibcommute), and so is also *highly experimental*.  If the rebase cannot be performed, it will throw a `TypeError`.

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

# JSON Diff and Patch

Jiff is an implementation of a subset of [JSON Patch RFC6902](https://tools.ietf.org/html/rfc6902), plus a Diff implementation that generates compliant patches.

It currently supports JSON Patch `add`, `replace`, and `remove` operations.  It *does not* yet support `move`, `copy`, and `test`.

## Get it

`npm install --save jiff`

`bower install --save jiff`

## API

### diff

```js
var patch = jiff.diff(a, b [, hashFunction]);
```

Computes and returns a JSON Patch from `a` to `b`: `a` and `b` must be valid JSON objects/arrays/values of the same type. If `patch` is applied to `a`, it will yield `b`.

If provided, the optional `hashFunction` will be used to recognize when two objects are the same.  If not provided, `JSON.stringify` will be used.

### patch

```js
var b = jiff.patch(patch, a);
```

Given a patch created with `jiff.diff`, apply it to `a` and return the patched JSON object/array/value.

### clone

```js
var b = jiff.clone(a);
```

Creates a deep copy of `a`, which must be a valid JSON object/array/value.

## License

MIT
<div align="center">
  <p>
    <img alt="Gadget logo" src="https://raw.githubusercontent.com/gadget-inc/js-clients/main/docs/assets/gadget-logo.png" style="width: 50%" />
  </p>
  <p>
    <strong>
      A mirror of the mobx-state-tree API that allows constructing fast, read-only instances.
    </strong>
  </p>
</div>

## Why?

`mobx-state-tree` is great for modeling in a reactive context, but it can be a bit unwieldy to reuse the view logic in a non-reactive context.

`@gadgetinc/mobx-quick-tree` mirrors the `mobx-state-tree` API so that you can still use all the great MST things you always have, but also allows you to construct a performant, read-only version of the tree.

If you need even more performance, `mobx-quick-tree` has an ES6 class-based API that replaces the pretty-but-slow MST API. By using ES6 classes, the prototype chain of the read-only objects can do a lot more heavy lifting, requiring fewer memory allocations and allowing faster instantiation speed.

## Example

```typescript
import { types } from "@gadgetinc/mobx-quick-tree";

// use types.model from MQT the exact same way you might use types.model from MST
const MyAdder = types
  .model({
    left: types.number,
    right: types.number,
  })
  .views((self) => ({
    get sum() {
      return self.left + self.right;
    },
  }));

// .create() creates an MST node, same as the MST API
console.log(MyAdder.create({ left: 1, right: 2 }).sum);

// .createReadOnly() creates an MQT node which is ~100x faster, but the node isn't observable and can't have actions run on it.
console.log(MyAdder.createReadOnly({ left: 1, right: 2 }).sum);
```

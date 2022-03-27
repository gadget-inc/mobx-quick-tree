<div align="center">
  <p>
    <img alt="Gadget logo" src="https://raw.githubusercontent.com/gadget-inc/js-clients/main/docs/assets/gadget-logo.png" />
  </p>
  <p>
    <strong>
      A mirror of the mobx-state-tree API that allows constructing a read-only tree that is lightning fast.
    </strong>
  </p>
</div>

## Why?

`mobx-state-tree` (MST) is great for modeling in a reactive context, but it can be a bit unwieldy to reuse the view logic in a non-reactive context.

`mobx-quick-tree` mirrors the `mobx-state-tree` API so that you can still use all the great MST things you always have, but also allows you to construct a performant, read-only version of the tree.

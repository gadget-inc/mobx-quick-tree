<div align="center">
  <p>
    <img alt="Gadget logo" src="https://raw.githubusercontent.com/gadget-inc/js-clients/main/docs/assets/gadget-logo.png" style="width: 50%" />
  </p>
  <p>
    <strong>
      A mirror of the `mobx-state-tree` API that allows constructing fast, read-only instances.
    </strong>
  </p>
</div>

`mobx-quick-tree` is a wrapper around `mobx-state-tree` that adds a second, interface-identical type for each `mobx-state-tree` type you define that is high-performance, read-only, and no longer observable.

## Why?

[`mobx-state-tree`](https://mobx-state-tree.js.org/) is great for modeling data and observing changes to it, but it adds a lot of runtime overhead! Raw `mobx` itself adds substantial overhead over plain old JS objects or ES6 classes, and `mobx-state-tree` adds more on top of that. If you want to use your MST data models in a non-reactive or non-observing context, all that runtime overhead for observability is just wasted, as nothing is ever changing.

`mobx-quick-tree` implements the same API as MST and exposes the same useful observable instances for use in observable contexts, but adds a second option for instantiating a read-only instance that is 100x faster.

If `mobx-state-tree` instances are great for modeling within an "editor" part of an app where nodes and properties are changed all over the place, the performant, read-only instances constructed by `mobx-quick-tree` are great for using within a "read" part of an app that displays data in the tree without ever changing it. For a website builder for example, you might use MST in the page builder area where someone arranges components within a page, and then use MQT in the part of the app that needs to render those webpages frequently.

### Two APIs

`mobx-quick-tree` has two APIs for building performant, read-only versions of your models:

- a 100% compatible, drop-in replacement for the `mobx-state-tree` API using `types.model`, `types.compose`, etc
- an ES6 `class` based API that performs even faster in read-only mode

### Drop-in `mobx-state-tree` API compatibility

To begin using `mobx-quick-tree`, change all your import statements from importing `mobx-state-tree` to import `mobx-quick-tree`. `mobx-quick-tree` exports all the same utilities and objects and maintains the same robust TypeScript support `mobx-state-tree` users are used to.

For example, if you have a `types.model` defined, you can keep the definition entirely the same, but define it using the `types` object imported from `mobx-quick-tree`:

```typescript
import { types } from "@gadgetinc/mobx-quick-tree"

// use types.model from MQT the exact same way you might use types.model from MST
const Todo = types.model("Todo", {
  name: types.string,
  done: types.boolean
}).actions(self => {
  setDone(done: boolean) {
    self.done = done;
  }
});

// create an observable instance with `create`, using mobx-state-tree under the hood
const instance = create(Todo, {name: "Hello", done: false});
// actions run like normal on observable instances
instance.setDone(true)

// create a readonly instance which is ~100x faster
const readOnlyInstance = create(Todo, {name: "Hello read only", done: false}, true);
readOnlyInstance.setDone(true) // will throw an error, the instance is readonly

// the old style Type.create form works as well for creating observable instances, but is discouraged
const oldStyleInstance = Todo.create({name: "Hello", done: false}); // prefer the create(Todo) form for better types
```

#### API coverage

`mobx-quick-tree` supports the same functionality as `mobx-state-tree` on observable instances, like:

- actions, views, and volatiles
- references
- snapshots
- patch streams
- middleware
- full type safety

Many of the pieces of functionality don't make sense to call on read only instances and will throw however. Functions that change data, like `applyPatch` or `applySnapshot` will work as documented in MST against observable instances, but will throw errors when run against read-only instances created with `create(..., ..., true)`.

Type-level functions like `isModelType` or `isUnionType` report type information correctly when run against types defined using `mobx-quick-tree`.

#### Mixing `mobx-state-tree` and `mobx-quick-tree`.

`mobx-quick-tree` does _not_ support mixing types or instances defined with `mobx-state-tree`. `mobx-quick-tree` can co-exist in the same process, but will error if used in the same tree with `mobx-state-tree`.

If switching from `mobx-state-tree` to `mobx-quick-tree`, we recommend **completely removing** `mobx-state-tree` from your package.json, and switching all import statements over to import from `mobx-quick-tree`.

### ES6 class-based Model API

If you need even more performance, `mobx-quick-tree` has an ES6 class-based API that replaces the pretty-but-slow MST API. The MST API design forces re-running each `views` or `actions` block for each and every instance defined, which adds a lot of overhead and is often not well handled by the JS VM. By using ES6 classes, each view and action can be defined only once at require time, and the prototype chain of the read-only objects can do a lot more of the heavy lifting.

These high-performance classes still allow accessing an observable instance that functions equivalently to a type defined using the `mobx-state-tree` API, so they can still be used in both observable and non-observable contexts.

Readonly instances created with the ES6 Class Model API from `mobx-quick-tree` are 3x faster than the readonly instances created with the MST style API, for a total of a 300x performance improvement.

To define an ES6 class model, you use a different API than `mobx-state-tree` that only `mobx-quick-tree` exports.

For example, a `Todo` class model can be defined like so:

```typescript
import { register, ClassModel, action, types } from "@gadgetinc/mobx-quick-tree";

@register
class Todo extends ClassModel({
  name: types.string,
  done: types.boolean,
}) {
  @action
  setDone(done: boolean) {
    this.done = done;
  }
}

// create a readonly instance which is ~300x faster, using a normal `new` call
const readOnlyInstance = create(Todo, { name: "Hello read only", done: false }, true);
readOnlyInstance.setDone(true); // will throw an error, the instance is readonly

// create an observable instance with `create`, using mobx-state-tree under the hood
const instance = create(Todo, { name: "Hello", done: false });
// actions run like normal on observable instances
instance.setDone(true);
```

#### Requirements for using Class Model API

To use the Class Model API and maintain compatibility with both read-only and observable instances, you must adhere to the following rules:

- All Class Models need to subclass a base class created by the `ClassModel` base class generator
- All Class Models need to be registered using the `@register` decorator
- All view functions or getters on the class need to be decorated with the `@view` decorator. These are the functions that would be MST `.views()` or raw mobx `computed` functions.
- All functions which mutate data must be decorated with the `@action` function. These are the functions that would be MST `.actions()` or raw mobx `action` functions.
- All volatile properties (those excluded from MST snapshots) must be registered with the `@volatile` decorator. These are the properties that would be modeled using MST's `.volatile()` API

#### Setting up a Class Model

Class models are defined using normal ES6 classes that are decorated and extend a special, dynamically generated base class. Class models store data by passing a list of typed properties to store to the `ClassModel` base class generator:

```typescript
import { ClassModel, register, view, action } from "@gadgetinc/mobx-quick-tree";

@register
class Car extends ClassModel({
  make: types.string,
  model: types.string,
  year: types.number,
}) {
  // define a view with a function and the @view decorator
  @view
  name() {
    // refer to properties of the model with `this`
    return `${this.year} ${this.model} ${this.make}`;
  }

  // define an action with a function
  @action
  setModel(model: string) {
    // set  properties of the model on `this`
    this.model = model;
  }
}
```

Each Class Model **must** be registered with the system using the `@register` decorator in order to be instantiated.
`@register` is necessary for setting up the internal state of the class and generating the observable MST type.

Within Class Model class bodies, refer to the current instance using the standard ES6/JS `this` keyword. `mobx-state-tree` users tend to use `self` within view or action blocks, but Class Models return to using standard JS `this` for performance.

#### Creating instances of a class model

Once you have a Class Model class created, you can create both read-only instances and observable instances of it.

To create an **observable** instance of a Class Model, use the static `.create` method:

```typescript
// create an observable instance
const observableInstance = create(Car, { make: "Toyota", model: "Prius", year: 2008 });

// access properties of the observable, will be observed if run within an observer
car.make; // => "Toyota"

// run actions to change data and fire observers by calling action functions
car.setModel("Camry");
```

To create an **read only** instance of a Class Model, use the `new` keyword with the class and pass `true` for the third argument:

```typescript
// create an read only instance
const readOnlyInstance = create(Car, { make: "Toyota", model: "Prius", year: 2008 }, true);

// access properties of the observable, will be observed if run within an observer
car.make; // => "Toyota"

// actions will throw if called on a readonly instance
// car.setModel("Camry"); => would throw an throw error
```

##### Differences in using a Class Model and a `types.model`

At runtime, observable instances of Class Models and `types.model` instances behave very similarly. Both are built atop `mobx-state-tree`, so views, mobx `computed`s, `mobx-react` observer components, and any other compatible component of the mobx ecosystem can observe properties on instances of either type.

At runtime, readonly instances of Class Models and `types.model` instances behave similarly, but Class Models should be instantiated with the `new` operator and `types.model` models must be instantiated with the `.createReadOnly` static function.

If using TypeScript, Class Model instances and `types.model` instances should be treated slightly differently. `mobx-state-tree` uses the `Instance` helper to refer to instances of a type, like `Instance<typeof Car>`. Since Class Models are real classes, instances of them can be referred to with just the name of the class, like `Car`, without needing to use the `Instance` helper. This matches standard ES6 class behavior.

Quick reference for type-time differences:

| Type                       | `types.model` model         | Class Model model                                   |
| -------------------------- | --------------------------- | --------------------------------------------------- |
| Type of an instance        | `Instance<typeof Model>`    | `Model` (though `Instance<typeof Model>` works too) |
| Input snapshot of a model  | `SnapshotIn<typeof Model>`  | `SnapshotIn<typeof Model>`                          |
| Output snapshot of a model | `SnapshotOut<typeof Model>` | `SnapshotOut<typeof Model>`                         |

#### Defining views with `@view`

Class Models support views on instances, which are functions that derive new state from existing state. Class Model views mimic `mobx-state-tree` views defined using the `.views()` API on models defined with `types.model`. See the [`mobx-state-tree` views docs](https://mobx-state-tree.js.org/concepts/views) for more information.

To define a view on a Class Model, define a function that takes no arguments or a getter within a Class Model body, and register it as a view with `@view`.

```typescript
import { ClassModel, register, view } from "@gadgetinc/mobx-quick-tree";

@register
class Car extends ClassModel({
  make: types.string,
  model: types.string,
  year: types.number,
}) {
  // define a view with a function and the @view decorator
  @view
  name() {
    // refer to properties of the model with `this`
    return `${this.year} ${this.model} ${this.make}`;
  }
}

const car = create(Car, { make: "Toyota", model: "Prius", year: 2008 });
// run the view
car.name(); // => "2008 Toyota Prius"
```

Views can be defined as functions which don't take arguments like above, or as getter properties on the class body:

```typescript
import { ClassModel, register, view } from "@gadgetinc/mobx-quick-tree";

@register
class Car extends ClassModel({
  make: types.string,
  model: types.string,
  year: types.number,
}) {
  // define a view as a property with a getter and the @view decorator
  @view
  get name() {
    // refer to properties of the model with `this`
    return `${this.year} ${this.model} ${this.make}`;
  }
}

const car = create(Car, { make: "Toyota", model: "Prius", year: 2008 });
// run the view
car.name; // => "2008 Toyota Prius"
```

Views are available on both read-only and observable instances of Class Models.

#### Defining actions with `@action`

Class Models support actions on instances, which are functions that change state on the instance or it's children. Class Model actions are exactly the same as `mobx-state-tree` actions defined using the `.actions()` API on a `types.model`. See the [`mobx-state-tree` actions docs](https://mobx-state-tree.js.org/concepts/actions) for more information.

To define an action on a Class Model, define a function within a Class Model body, and register it as an action with `@action`.

```typescript
import { ClassModel, register, action } from "@gadgetinc/mobx-quick-tree";

@register
class Car extends ClassModel({
  make: types.string,
  model: types.string,
  year: types.number,
}) {
  // define an action with a function
  @action
  setModel(model: string) {
    // set properties of the model on `this`
    this.model = model;
  }

  // actions don't need to take arguments
  @action
  addYear() {
    this.year = this.year + 1;
  }
}

const car = create(Car, { make: "Toyota", model: "Prius", year: 2008 });
car.year; // => 2008
car.addYear(); // run the action
car.year; // => 2009
```

Actions are only available on observable instances created with `.create` or by passing `false` in the third argument to `new`.

##### Asynchronous actions / `flow`s

`mobx-state-tree` allows defining asynchronous actions using the `flow` helper. Asynchronous actions can't use `async`/`await`, and instead must use generator functions so that `mobx-state-tree` can wrap each chunk of execution with the appropriate wrappers.

To define an asynchronous action, use the `@flowAction` decorator instead of the `@action` decorator, and use a generator function for your action:

```typescript
import { ClassModel, register, action } from "@gadgetinc/mobx-quick-tree";

@register
class Store extends ClassModel({
  data: types.string,
}) {
  // define an async action with a generator function and the @flowAction decorator
  @flowAction
  *load() {
    // use `yield` like you might use `await` to run promises
    this.data = yield getNewDataSomehow();
  }
}

const store = create(Store, { data: "" });

// call async actions with `await`
await store.load();
```

Note: The `flow` decorator exported by `mobx-quick-tree` is for use with `types.model` models only, and should never be used with Class Models. Instead, use the `@flowAction` decorator.

#### Defining volatile properties with `@volatile`

Class Models support volatile properties on instances, which are observable properties that are excluded from any snapshots. Volatiles last only for the lifetime of the object and are _not_ persisted because they aren't serialized into snapshots or read out of incoming snapshots. Class Model volatiles are exactly the same as `mobx-state-tree` volatiles defined using the `.volatile()` API on a `types.model`.

Volatile tends to be most useful for implementation details, like timers, counters, transport objects like `fetch` requests, or other state that only matters for making other stuff work as opposed to saving source of truth data that might belong in a database. See the [`mobx-state-tree` volatile docs](https://mobx-state-tree.js.org/concepts/volatiles) for more information.

Volatiles can be referred to and used in views, and changed by actions. Volatile properties are observable, so you can rely on views recomputing if they change for observable instances.

To define an volatile property on a Class Model, define a type-only property within a Class Model body, and register it as a volatile `@volatile` that initializes the value:

```typescript
import { ClassModel, register, action } from "@gadgetinc/mobx-quick-tree";

@register
class Loader extends ClassModel({}) {
  @volatile((_instance) => "ready");
  state!: string;

  @action
  reload() {
    self.state = "loading"
    // ... do something else
    self.state = "ready"
  }
}

const car = create(Car, { make: "Toyota", model: "Prius", year: 2008 });
car.reload();
```

Volatile properties are initialized using the initializer function passed to the `@volatile` decorator. The initializer is passed the instance being initialized, and must return a value to be set as the value of the property.

Volatile properties are available on both read-only and observable instances. On read-only instances, volatiles will be initialized to the value returned by the initializer, and can't be changed after as actions are not available..

#### References to and from class models

Class Models support `types.references` within their properties as well as being the target of `types.reference`s on other models or class models.

For example, a Class Model can references another Class Model in it's properties with `types.reference`:

```typescript
@register
class Make extends ClassModel({
  name: types.string,
}) {}

@register
class Car extends ClassModel({
  model: types.string,
  make: types.reference(Make),
}) {
  @view
  description() {
    return `${this.make.name} ${this.name}`;
  }
}
```

A Class model can also reference a MST API model defined with `types.model`:

```typescript
const Make = types.model("Make", { name: types.string });

@register
class Car extends ClassModel({
  model: types.string,
  make: types.reference(Make),
}) {
  @view
  description() {
    return `${this.make.name} ${this.name}`;
  }
}
```

An MST API model defined with `types.model` can also reference a Class Model:

```typescript
@register
class Make extends ClassModel({
  name: types.string,
}) {}

const Car = types
  .model({
    model: types.string,
    make: types.reference(Make),
  })
  .views((self) => ({
    description() {
      return `${self.make.name} ${self.name}`;
    },
  }));
```

#### Class model snapshots

`mobx-state-tree` and `mobx-quick-tree` both support snapshotting the rich instances defined in JS land using the `getSnapshot` function, and both conform to the same set of rules. Snapshots are useful for persisting data from one place to another, and for later re-creating instances that match with `applySnapshot` or `create`.

Snapshots in `mobx-quick-tree` apply in the same way as `mobx-state-tree` in that they can be serialized without issue to JSON. Instances are turned into snapshots according to the following rules:

- simple types like `types.boolean` or `types.string` are serialized as the equivalent JSON scalar type
- `types.maybeNull` will output null in the snapshot if no value is present
- `types.maybe` will be totally absent from the snapshot if no value is present
- `types.array` arrays are serialized as plain JS arrays
- `types.map` maps are turned into plain JS objects
- properties defined on models are all serialized into the snapshot
- actions, views, and volatiles on models will not be serialized at all into the snapshot
- references will be serialized to the snapshot as the value of the referenced node's identifier (and not re-serialize the whole referenced node)

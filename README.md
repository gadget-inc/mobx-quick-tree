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
```

Once you have a `mobx-quick-tree` type defined, you can use it the same way you might use a `mobx-state-tree` type:

```typescript
// create an observable instance with `create`, using mobx-state-tree under the hood
const instance = Todo.create({ name: "Hello", done: false });
// actions run like normal on observable instances
instance.setDone(true);
```

Each defined type also exposes a new `.createReadOnly` function for constructing read only versions of the type:

```typescript
// create a readonly instance which is ~100x faster
const readOnlyInstance = Todo.createReadOnly({ name: "Hello read only", done: false });
readOnlyInstance.setDone(true); // will throw an error, the instance is readonly
```

`.createReadOnly` exists on models, arrays, maps, etc, and will be used throughout a tree started with a `.createReadOnly` call.

#### API coverage

`mobx-quick-tree` supports the same functionality as `mobx-state-tree` on observable instances, like:

- actions, views, and volatiles
- references
- snapshots
- patch streams
- middleware
- full type safety

Many of the pieces of functionality don't make sense to call on read only instances and will throw however. Functions that change data, like `applyPatch` or `applySnapshot` will work as documented in MST against observable instances, but will throw errors when run against read-only instances created with `.createReadOnly`.

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

// create a readonly instance which is ~300x faster
const readOnlyInstance = Todo.createReadOnly({ name: "Hello read only", done: false });
readOnlyInstance.setDone(true); // will throw an error, the instance is readonly

// create an observable instance with `create`
const instance = Todo.create({ name: "Hello", done: false });
// actions run like normal on observable instances
instance.setDone(true);
```

The Class Model API works by using the class you define to power read only instances. Classes are fast to instantiate and are optimized well by JS VMs which makes them ideal for the high performance use case. For the observable instances, the Class Model API derives an equivalent type using `mobx-state-tree`'s `types.model`, and configures it to have all the same properties, views, actions, and volatiles that the class does. The read-only class and writable observable type have identical interfaces at runtime, but will be instances of two different classes.

To access the derived `mobx-state-tree` type explicitly for a class model, you can use the static `.mstType` property.

#### Requirements for using Class Model API

To use the Class Model API and maintain compatibility with both read-only and observable instances, you must adhere to the following rules:

- All Class Models need to subclass a base class created by the `ClassModel` base class generator
- All Class Models need to be registered using the `@register` decorator
- All functions which mutate data must be decorated with the `@action` function. These are the functions that would be MST `.actions()` or raw mobx `action` functions.
- Any undecorated functions or getters on the class will become views. These functions can only read data, and aren't allowed to mutate it. These are the functions that would be MST `.views()` or raw mobx `computed` functions. Views can also be explicitly decorated with the `@view` decorator.
- All [volatile](https://mobx-state-tree.js.org/concepts/volatiles) properties must be registered with the `@volatile` decorator. These are the properties that would be modeled using MST's `.volatile()` API and are excluded from any snapshots.

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
  // define a view with a function
  name() {
    // refer to properties of the model with `this`
    return `${this.year} ${this.model} ${this.make}`;
  }

  // define an action with a function, identify it as an action with the `@action` decorator
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

To create an **observable** instance of a Class Model, use the static `.create` function:

```typescript
// create an observable instance
const observableInstance = Car.create({ make: "Toyota", model: "Prius", year: 2008 });

// access properties of the observable, will be observed if run within an observer
car.make; // => "Toyota"

// run actions to change data and fire observers by calling action functions
car.setModel("Camry");
```

To create an **read only** instance of a Class Model, use the static `.createReadOnly` function:

```typescript
// create an read only instance
const readOnlyInstance = Car.createReadOnly({ make: "Toyota", model: "Prius", year: 2008 });

// access properties of the observable, will be observed if run within an observer
car.make; // => "Toyota"

// actions will throw if called on a readonly instance
// car.setModel("Camry"); => would throw an throw error
```

##### Differences in using a Class Model and a `types.model`

At runtime, observable instances of Class Models and `types.model` instances behave very similarly. Both are built atop `mobx-state-tree`, so views, mobx `computed`s, `mobx-react` observer components, and any other compatible component of the mobx ecosystem can observe properties on instances of either type.

At runtime, readonly instances of Class Models and readonly `types.model` instances behave similarly. Both are created with the `.createReadOnly` call.

If using TypeScript, Class Model instances and `types.model` instances should be treated slightly differently. `mobx-state-tree` uses the `Instance` helper to refer to instances of a type, like `Instance<typeof Car>`. Since Class Models are real classes, instances of them can be referred to with just the name of the class, like `Car`, without needing to use the `Instance` helper. This matches standard ES6 class behavior.

Quick reference for type-time differences:

| Type                       | `types.model` model         | Class Model model                                   |
| -------------------------- | --------------------------- | --------------------------------------------------- |
| Type of an instance        | `Instance<typeof Model>`    | `Model` (though `Instance<typeof Model>` works too) |
| Input snapshot of a model  | `SnapshotIn<typeof Model>`  | `SnapshotIn<typeof Model>`                          |
| Output snapshot of a model | `SnapshotOut<typeof Model>` | `SnapshotOut<typeof Model>`                         |

#### Defining views

Class Models support views on instances, which are functions that derive new state from existing state. Class Model views mimic `mobx-state-tree` views defined using the `.views()` API on models defined with `types.model`. See the [`mobx-state-tree` views docs](https://mobx-state-tree.js.org/concepts/views) for more information.

To define a view on a Class Model, define a function that takes no arguments or a getter within a Class Model body.

```typescript
import { ClassModel, register, view } from "@gadgetinc/mobx-quick-tree";

@register
class Car extends ClassModel({
  make: types.string,
  model: types.string,
  year: types.number,
}) {
  // define a view with a function. any undecorated functions are automatically defined as views
  name() {
    // refer to properties of the model with `this`
    return `${this.year} ${this.model} ${this.make}`;
  }
}

const car = Car.createReadOnly({ make: "Toyota", model: "Prius", year: 2008 });
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
  // define a view as a property with a getter
  get name() {
    // refer to properties of the model with `this`
    return `${this.year} ${this.model} ${this.make}`;
  }
}

const car = Car.createReadOnly({ make: "Toyota", model: "Prius", year: 2008 });
// run the view
car.name; // => "2008 Toyota Prius"
```

Views are available on both read-only and observable instances of Class Models.

Views can also be made explicit with the `@view` decorator:

```typescript
@register
class Car extends ClassModel({
  make: types.string,
  model: types.string,
  year: types.number,
}) {
  // define a view as a property with a getter and an explicit @view decorator
  @view
  name() {
    return `${this.year} ${this.model} ${this.make}`;
  }
}
```

Explicit decoration of views is exactly equivalent to implicit declaration of views without a decorator.

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

const car = Car.create({ make: "Toyota", model: "Prius", year: 2008 });
car.year; // => 2008
car.addYear(); // run the action
car.year; // => 2009
```

Actions are only available on observable instances created with `.create`, and are present but will throw errors if created on instances created with `.createReadOnly`.

##### Asynchronous actions / `flow`s

`mobx-state-tree` allows defining asynchronous actions using the `flow` helper. Asynchronous actions can't use `async`/`await`, and instead must use generator functions so that `mobx-state-tree` can wrap each chunk of execution with the appropriate wrappers. For more information on the generator-based async actions in `mobx-state-tree`, see the [`mobx-state-tree` async actions docs](https://mobx-state-tree.js.org/concepts/async-actions).

To define an asynchronous action in a class model, wrap your action generator function in the `flow()` helper, assign it to the name on the class, and apply the `@action` decorator like you might with synchronous actions.

```typescript
import { ClassModel, register, action } from "@gadgetinc/mobx-quick-tree";

@register
class Store extends ClassModel({
  data: types.string,
}) {
  // define an async action with a generator function, the flow() helper, and the @action decorator
  @action
  load = flow(function* (this: Store) {
    // use `yield` like you might use `await` to run promises
    this.data = yield getNewDataSomehow();
  });
}

const store = Store.create({ data: "" });

// call async actions with `await`
await store.load();
```

Creating asynchronous actions using generators works as follow:

- The action needs to be marked as generator, by postfixing the function keyword with a \* and a name (which will be used by middleware), and wrapping it with flow
- The action still needs to be wrapped in the `@action` decorator
- For type safety, the action needs to explicitly take a `this` argument with the type of the model (this is a typescript limitation with type inference across these instance functions)

Your flow action function can do all the normal things that an `async` function can do, but you call async functions a bit differently.

- The action can be paused by using a yield statement. Yield always needs to return a Promise.
- If the promise resolves, the resolved value will be returned from the yield statement, and the action will continue to run
- If the promise rejects, the action continues and the rejection reason will be thrown from the yield statement
- Invoking the asynchronous action returns a promise. That will resolve with the return value of the function, or rejected with any exception that escapes from the asynchronous actions.

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

const car = Car.create({ make: "Toyota", model: "Prius", year: 2008 });
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

#### Dynamically defining Class Models using class expressions

Usually, Class Models are defined using top level ES6 classes exported from from a file. For advanced use-cases, classes can also be built dynamically within functions using ES6 class expressions. Generally, static classes defined with decorators are clearer and more performant, but for fancy class factories and the like you may want to use class expressions which MQT supports with slightly different syntax.

To define a class using a class expression, you can no longer use the decorator based API suggested above, as in the latest version of TypeScript, decorators are not valid within class expressions. They work just fine in named classes, but not in dynamically defined classes that are passed around as values.

Instead, you need to explicitly call the `register` function with the class, the list of decorators you'd like to apply to the class, and optionally a string class name:

```typescript
// define an example function which returns a class model (a class factory)
const buildClass = () => {
  const klass = class extends ClassModel({
    key: types.string,
  }) {
    someView() {
      return this.key;
    }

    someAction(newKey: string) {
      this.key = newKey;
    }
  };

  return register(
    klass,
    {
      someView: view,
      someAction: action,
    },
    "Example"
  );
};

// invoke the class factory to define a class
const Example = buildClass();

const instance = Example.create({ key: "foo" });
instance.someAction("bar");
```

This pattern is most useful for class factories that create new classes dynamically. For example, we could build a class factory to define a Set of some other type:

```typescript
import { ClassModel, types, register, view, action } from "@gadgetinc/mobx-quick-tree";

// define a class factory that produces a new class model implementing a set for any type
const buildSet = <T extends IAnyType>(type: T) => {
  const klass = class extends ClassModel({
    items: types.array(type),
  }) {
    has(item: Instance<T>) {
      return this.items.some((existing) => existing == item);
    }

    add(item: Instance<T>) {
      if (!this.has(item)) {
        this.items.push(item);
      }
    }

    remove(item: Instance<T>) {
      this.items.remove(item);
    }
  };

  return register(klass, {
    add: action,
    remove: action,
    has: view,
  });
};

// produce a set of numbers class
const NumberSet = buildSet(types.number);

// create an instance of the set
const set = NumberSet.create();
set.add(1);
set.add(2);

set.has(1); // => true
set.has(3); // => false
```

#### Class model snapshots

`mobx-state-tree` and `mobx-quick-tree` both support snapshotting the rich instances defined in JS land using the `getSnapshot` function, and both conform to the same set of rules. Snapshots are useful for persisting data from one place to another, and for later re-creating instances that match with `applySnapshot` or `.create`/`.createReadOnly`.

Snapshots in `mobx-quick-tree` apply in the same way as `mobx-state-tree` in that they can be serialized without issue to JSON. Instances are turned into snapshots according to the following rules:

- simple types like `types.boolean` or `types.string` are serialized as the equivalent JSON scalar type
- `types.maybeNull` will output null in the snapshot if no value is present
- `types.maybe` will be totally absent from the snapshot if no value is present
- `types.array` arrays are serialized as plain JS arrays
- `types.map` maps are turned into plain JS objects
- properties defined on models are all serialized into the snapshot
- actions, views, and volatiles on models will not be serialized at all into the snapshot
- references will be serialized to the snapshot as the value of the referenced node's identifier (and not re-serialize the whole referenced node)

#### Sharing functionality between class models

When converting `types.model` models that use `types.compose`, you will need a deeper refactoring. `types.compose` is an implementation of multiple inheritance which ES6 classes don't support. There are a couple ways to re-use functionality in Class Models:

- If the reusable chunk is only properties, you can define a constant of the properties, and spread it in the `ClassModel({...})` base class definition. For example:

```typescript
const SharedProps = {
  name: types.string,
  phoneNumber: types.string,
};

@register
class Student extends ClassModel({
  homeroom: types.string,
  ...SharedProps,
}) {}

@register
class Teacher extends ClassModel({
  email: types.string,
  ...SharedProps,
}) {}
```

- If the reusable chunk is just logic like views and actions, you can use a function to subclass. For example:

```javascript
const addName = (klass) => {
  return class extends klass {
    name() {
      return this.firstName + " " + this.lastName;
    }
  };
};

@register
class Student extends addName(
  ClassModel({
    firstName: types.string,
    lastName: types.string,
    homeroom: types.string,
  })
) {}

@register
class Teacher extends addName(
  ClassModel({
    firstName: types.string,
    lastName: types.string,
    email: types.string,
  })
) {}
```

If the reusable chunk includes both properties and views or actions, you can combine the two techniques.

#### Converting a `types.model` to a Class Model

Changing a `types.model` into a Class Model requires two key changes:

- changing the syntax used to define the model
- switching any `types.compose` calls to become subclasses, or spread properties in the `ClassModel` base class factory.

##### Updating `types.model` syntax to become a `ClassModel`

To convert a `types.model` into a Class Model, you need to update the definition to use a class body. Here are the conversion rules:

- `types.model("Name", {...properties...})` becomes `class Name extends ClassModel({...properties...})`
- the newly registered class needs to have the `@register` decorator
- any views defined in `.views(...)` blocks become functions defined on the class decorated with the `@view` decorator
- any actions defined in `.actions(...)` blocks become functions defined on the class decorated with the `@action` decorator, including `flow()` actions
- any volatile properties defined in `.volatile()` blocks become one `@volatile` property in the class per property.

For example, lets say we have this `types.model` model:

```typescript
import { types } from "@gadgetinc/mobx-quick-tree";

const Car = types
  .model("Car", {
    make: types.string,
    model: types.string,
    year: types.number,
  })
  .views((self) => ({
    get name() {
      return `${self.year} ${self.make} ${self.model}`;
    },
    sku() {
      return `CAR-${self.year}-${self.model}`;
    },
  }))
  .actions((self) => ({
    setModel(model: string) {
      self.model = model;
    },
  }));
```

an equivalent Class Model would read:

```typescript
import { types, register, action, view, ClassModel } from "@gadgetinc/mobx-quick-tree";

@register
class Car extends ClassModel({
  make: types.string,
  model: types.string,
  year: types.number,
}) {
  get name() {
    return `${self.year} ${self.make} ${self.model}`;
  }
  sku() {
    return `CAR-${self.year}-${self.model}`;
  }
  @action
  setModel(model: string) {
    self.model = model;
  }
}
```

##### Updating `types.model` volatiles to become `ClassModel` volatiles

In `types.model` models, [volatiles](https://mobx-state-tree.js.org/concepts/volatiles) are defined using the `.volatile()` call to add multiple properties, each with an initial value. In Class Models, volatiles are defined one at a time with the `@volatile` decorator.

For example, with this `types.model` model:

```typescript
const Store = types.model("Store", {
  data: types.string;
}).volatile((self) => ({
  state: "not-started",
  finished: false
})).actions(self => ({
  load: flow(function *() {
    self.state = "loading"
    try {
      self.data = yield loadSomeData();
      self.state = "loaded";
    } catch (error) {
      self.state = "error";
    } finally {
      self.finished = true;
    }
  });
}));
```

we convert each volatile property into a `@volatile` call on the class body:

```typescript
@register
class Store extends ClassModel({
  data: types.string;
}) {
  @volatile(() => "not-started")
  state: string

  @volatile(() => false)
  finished: boolean

  @action
  load = flow(function *(this: Store) {
    this.state = "loading"
    try {
      this.data = yield loadSomeData();
      this.state = "loaded";
    } catch (error) {
      this.state = "error;
    } finally {
      this.finished = true;
    }
  });
};
```

import { ObservableMap, makeObservable, observable } from "mobx";
import { TestModel } from "../../spec/fixtures/TestModel";

export class ObservableNamedThing {
  key: string;
  name: string;

  constructor(snapshot: { key: string; name: string }) {
    this.key = snapshot.key;
    this.name = snapshot.name;

    makeObservable(this, {
      key: observable,
      name: observable,
    });
  }
}

export class ObservablePlainModel {
  bool: boolean;
  frozen: any;
  nested: ObservableNamedThing;
  array: ObservableNamedThing[];
  map: Map<string, ObservableNamedThing>;
  optional: "value";

  constructor(snapshot: (typeof TestModel)["InputType"]) {
    this.bool = snapshot.bool;
    this.frozen = snapshot.frozen;
    this.nested = new ObservableNamedThing(snapshot["nested"]);
    this.array = observable.array((snapshot["array"] ?? []).map((element) => new ObservableNamedThing(element)));

    this.map = observable.map();
    if (snapshot.map) {
      for (const key in snapshot.map) {
        this.map.set(key, new ObservableNamedThing(snapshot.map[key]));
      }
    }

    this.optional = "value";

    makeObservable(this, {
      bool: observable,
      frozen: observable,
      nested: observable,
      array: observable,
      map: observable,
      optional: observable,
    });
  }
}

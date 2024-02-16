import { TestModel } from "../../spec/fixtures/TestModel";

export class PlainNamedThing {
  key: string;
  name: string;

  constructor(snapshot: { key: string; name: string }) {
    this.key = snapshot.key;
    this.name = snapshot.name;
  }
}

export class TestPlainModel {
  bool: boolean;
  frozen: any;
  nested: PlainNamedThing;
  array: PlainNamedThing[];
  map: Map<string, PlainNamedThing>;
  optional: "value";

  constructor(snapshot: (typeof TestModel)["InputType"]) {
    this.bool = snapshot.bool;
    this.frozen = snapshot.frozen;
    this.nested = new PlainNamedThing(snapshot["nested"]);
    this.array = (snapshot["array"] ?? []).map((element) => new PlainNamedThing(element));

    this.map = new Map();
    if (snapshot.map) {
      for (const key in snapshot.map) {
        this.map.set(key, new PlainNamedThing(snapshot.map[key]));
      }
    }

    this.optional = "value";
  }
}

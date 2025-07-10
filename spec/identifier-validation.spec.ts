import { types } from "../src";

describe("Identifier validation in generated code", () => {
  it("should use dot notation for valid identifiers", () => {
    const TestModel = types.model("TestModel", {
      validProp: types.string,
      anotherValid: types.number,
      _underscore: types.boolean,
      $dollar: types.string,
    });

    const instance = TestModel.createReadOnly({
      validProp: "test",
      anotherValid: 42,
      _underscore: true,
      $dollar: "value",
    });

    expect(instance.validProp).toBe("test");
    expect(instance.anotherValid).toBe(42);
    expect(instance._underscore).toBe(true);
    expect(instance.$dollar).toBe("value");
  });

  it("should use bracket notation for invalid identifiers", () => {
    const TestModel = types.model("TestModel", {
      "invalid-prop": types.string,
      "123numeric": types.number,
      "with spaces": types.boolean,
      "kebab-case": types.string,
      "dot.notation": types.string,
      "class": types.string,
    });

    const instance = TestModel.createReadOnly({
      "invalid-prop": "test",
      "123numeric": 42,
      "with spaces": true,
      "kebab-case": "safe",
      "dot.notation": "safe",
      "class": "safe",
    });

    expect(instance["invalid-prop"]).toBe("test");
    expect(instance["123numeric"]).toBe(42);
    expect(instance["with spaces"]).toBe(true);
    expect(instance["kebab-case"]).toBe("safe");
    expect(instance["dot.notation"]).toBe("safe");
    expect(instance["class"]).toBe("safe");
  });

  it("should handle edge cases with special characters", () => {
    const TestModel = types.model("TestModel", {
      "kebab-case": types.string,
      "dot.notation": types.string,
      "bracket[notation]": types.string,
      "unicode-ñ": types.string,
      "emoji-🚀": types.string,
    });

    const instance = TestModel.createReadOnly({
      "kebab-case": "kebab",
      "dot.notation": "dot",
      "bracket[notation]": "bracket",
      "unicode-ñ": "unicode",
      "emoji-🚀": "emoji",
    });

    expect(instance["kebab-case"]).toBe("kebab");
    expect(instance["dot.notation"]).toBe("dot");
    expect(instance["bracket[notation]"]).toBe("bracket");
    expect(instance["unicode-ñ"]).toBe("unicode");
    expect(instance["emoji-🚀"]).toBe("emoji");
  });

  it("should handle reserved JavaScript keywords", () => {
    const TestModel = types.model("TestModel", {
      "if": types.string,
      "for": types.string,
      "while": types.string,
      "function": types.string,
      "var": types.string,
      "let": types.string,
      "const": types.string,
    });

    const instance = TestModel.createReadOnly({
      "if": "conditional",
      "for": "loop",
      "while": "iteration",
      "function": "callable",
      "var": "variable",
      "let": "binding",
      "const": "constant",
    });

    expect(instance["if"]).toBe("conditional");
    expect(instance["for"]).toBe("loop");
    expect(instance["while"]).toBe("iteration");
    expect(instance["function"]).toBe("callable");
    expect(instance["var"]).toBe("variable");
    expect(instance["let"]).toBe("binding");
    expect(instance["const"]).toBe("constant");
  });
});

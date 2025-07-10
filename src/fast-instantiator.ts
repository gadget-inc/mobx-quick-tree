import { isReferenceType } from "mobx-state-tree";
import type { IAnyModelType as MSTIAnyModelType, IAnyType as MSTIAnyType } from "mobx-state-tree";
import { ArrayType, QuickArray } from "./array";
import type { SnapshottedViewMetadata } from "./class-model";
import type { FastGetBuilder } from "./fast-getter";
import { FrozenType } from "./frozen";
import { MapType, QuickMap } from "./map";
import { MaybeNullType, MaybeType } from "./maybe";
import { OptionalType } from "./optional";
import { ReferenceType, SafeReferenceType } from "./reference";
import { DateType, IntegerType, LiteralType, SimpleType } from "./simple";
import { $context, $identifier, $notYetMemoized, $parent, $readOnly, $type } from "./symbols";
import type { IAnyType, IClassModelType, ValidOptionalValue } from "./types";

/**
 * Validates if a string is a valid JavaScript identifier that can be used with dot notation
 */
const isValidIdentifier = (name: string): boolean => {
  return (
    /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name) &&
    !["constructor", "prototype", "__proto__", "hasOwnProperty", "valueOf", "toString"].includes(name) &&
    ![
      "break",
      "case",
      "catch",
      "class",
      "const",
      "continue",
      "debugger",
      "default",
      "delete",
      "do",
      "else",
      "export",
      "extends",
      "finally",
      "for",
      "function",
      "if",
      "import",
      "in",
      "instanceof",
      "new",
      "return",
      "super",
      "switch",
      "this",
      "throw",
      "try",
      "typeof",
      "var",
      "void",
      "while",
      "with",
      "yield",
      "let",
      "static",
      "enum",
      "implements",
      "package",
      "protected",
      "interface",
      "private",
      "public",
    ].includes(name)
  );
};
/**
 * Generates the appropriate property access syntax for a given key
 */
const propertyAccess = (key: string): string => {
  return isValidIdentifier(key) ? `.${key}` : `["${key}"]`;
};

type DirectlyAssignableType = SimpleType<any> | IntegerType | LiteralType<any> | DateType;
const isDirectlyAssignableType = (type: IAnyType): type is DirectlyAssignableType => {
  return (
    type instanceof SimpleType ||
    type instanceof LiteralType ||
    type instanceof DateType ||
    type instanceof FrozenType ||
    type instanceof IntegerType
  );
};

/**
 * Compiles a fast class constructor that takes snapshots and turns them into instances of a class model.
 **/
export class InstantiatorBuilder<T extends IClassModelType<Record<string, IAnyType>, any, any>> {
  aliases = new Map<string, string>();

  constructor(
    readonly model: T,
    readonly getters: FastGetBuilder,
  ) {}

  build(): T {
    const segments: string[] = [];

    for (const [key, type] of Object.entries(this.model.properties)) {
      if (isDirectlyAssignableType(type)) {
        segments.push(`
          // simple type for ${key}
          this${propertyAccess(key)} = ${this.expressionForDirectlyAssignableType(key, type)};
      `);
      } else if (type instanceof OptionalType) {
        segments.push(this.assignmentExpressionForOptionalType(key, type));
      } else if (isReferenceType(type.mstType)) {
        segments.push(this.assignmentExpressionForReferenceType(key, type));
      } else if (type instanceof ArrayType) {
        segments.push(this.assignmentExpressionForArrayType(key, type));
      } else if (type instanceof MapType) {
        segments.push(this.assignmentExpressionForMapType(key, type));
      } else {
        segments.push(`
          // instantiate fallback for ${key} of type ${safeTypeName(type)}
          this${propertyAccess(key)} = ${this.alias(`model.properties["${key}"]`)}.instantiate(
            snapshot?.["${key}"],
            context,
            this
          );
        `);
      }
    }

    for (const [key, _metadata] of Object.entries(this.model.volatiles)) {
      segments.push(`
      this${propertyAccess(key)} = ${this.alias(`model.volatiles["${key}"]`)}.initializer(this);
    `);
    }

    const modelType = innerModelType(this.model.mstType);
    const identifierProp = modelType?.identifierAttribute;
    if (identifierProp) {
      segments.push(`
      const id = this${propertyAccess(identifierProp)};
      this[$identifier] = id;
      context.referenceCache.set(id, this);
    `);
    }

    for (const snapshottedView of this.model.snapshottedViews) {
      segments.push(this.assignSnapshottedViewExpression(snapshottedView));
    }

    let className = this.model.name;
    if (!className || className.trim().length == 0) {
      className = "AnonymousModel";
    }

    const defineClassStatement = `
      class ${className} extends model {
        static createReadOnly = (snapshot, env) => {
          const context = {
            referenceCache: new Map(),
            referencesToResolve: [],
            env,
          };

          const instance = new ${className}(snapshot, context, null);

          // resolve any references that were deferred
          for (const { owner, identifier, property, required, instantiateUsing } of context.referencesToResolve) {
            if (instantiateUsing) {
              owner[property] = instantiateUsing.instantiate(identifier, context, owner);
            } else {
              const target = context.referenceCache.get(identifier);
              if (target) {
                owner[property] = target;
              } else if (required) {
                throw new Error(\`can't resolve reference for property "\${property}" using identifier \${identifier}\`);
              }
            }
          }

          context.referencesToResolve = null; // cleanup the list of references to resolve, no need to retain them past construction

          return instance;
        };

        static instantiate(snapshot, context, parent) {
          return new ${className}(snapshot, context, parent);
        };

        static is(value) {
          return (value instanceof ${className}) || ${className}.mstType.is(value);
        };

        constructor(
          snapshot,
          context,
          parent,
          /** @hidden */ hackyPreventInitialization = false
        ) {
          super(null, null, null, true);

          if (hackyPreventInitialization) {
            return;
          }

          this[$context] = context;
          this[$parent] = parent;

          ${segments.join("\n")}
        }

        get [$readOnly]() {
          return true;
        }

        get [$type]() {
          return this.constructor;
        }
      }
    `;

    const aliasFuncBody = `
    const { QuickMap, QuickArray, $identifier, $context, $parent, $notYetMemoized, $readOnly, $type, snapshottedViews } = imports;

    ${Array.from(this.aliases.entries())
      .map(([expression, alias]) => `const ${alias} = ${expression};`)
      .join("\n")}

    ${defineClassStatement}

    ${this.getters.outerClosureStatements(className)}

    return ${className}
  `;

    // console.log(`function for ${this.model.name}`, "\n\n\n", aliasFuncBody, "\n\n\n");

    try {
      // build a function that closes over a bunch of aliased expressions
      // evaluate the inner function source code in this closure to return the function
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const aliasFunc = eval(`
        (
          function buildFastInstantiator(model, imports) {
            ${aliasFuncBody}
          }
        )
        //# sourceURL=mqt-eval/dynamic/${className}.js
      `);

      // evaluate aliases and get created inner function
      return aliasFunc(this.model, {
        $identifier,
        $context,
        $parent,
        $readOnly,
        $type,
        $notYetMemoized,
        QuickMap,
        QuickArray,
        snapshottedViews: this.model.snapshottedViews,
      }) as T;
    } catch (e) {
      console.warn("failed to build fast instantiator for", this.model.name);
      console.warn("dynamic source code:", aliasFuncBody);
      throw e;
    }
  }

  private expressionForDirectlyAssignableType(key: string, type: DirectlyAssignableType, valueExpression = `snapshot?.["${key}"]`) {
    return type instanceof DateType ? `new Date(${valueExpression})` : valueExpression;
  }

  private assignmentExpressionForReferenceType(key: string, type: IAnyType): string {
    const identifierVarName = `identifier${key}`;
    const instanceVarName = `instance${key}`;

    let required: boolean;
    let instantiateUsing: string | null = null;
    if (
      type instanceof SafeReferenceType ||
      ((type instanceof MaybeType || type instanceof MaybeNullType) &&
        (type.type instanceof ReferenceType || type.type instanceof SafeReferenceType))
    ) {
      // we're resolving a safe reference, or a maybe/maybeNull of a reference. don't error if the reference can't be resolved
      required = false;
    } else if (type instanceof ReferenceType) {
      // we're resolving a plain old reference -- error if the reference can't be resolved
      required = true;
    } else {
      // we're resolving a type that `isReferenceType` returns true for, but that we don't have a fastpath for, like a union of a model and a reference. fall back this type's instantiate call, but do it late in a context callback so that any reference elements of the union can be resolved
      required = false;
      instantiateUsing = this.alias(`model.properties["${key}"]`);
    }

    return `
      // setup reference for ${key}
      const ${identifierVarName} = snapshot?.["${key}"];

      // eager resolve path: check the reference cache immediately for the identifier
      const ${instanceVarName} = context.referenceCache.get(${identifierVarName});
      if (${instanceVarName}) {
        ${instantiateUsing ? `this${propertyAccess(key)} = ${instantiateUsing}.instantiate(${identifierVarName}, context, this);` : `this${propertyAccess(key)} = ${instanceVarName};`}
      } else {
        // late resolve path: add a descriptor to the context to resolve the reference later
        context.referencesToResolve.push({
          owner: this,
          identifier: ${identifierVarName},
          property: "${key}",
          required: ${required},
          instantiateUsing: ${instantiateUsing}
        });
      }
    `;
  }

  private assignmentExpressionForOptionalType(key: string, type: OptionalType<IAnyType, [ValidOptionalValue, ...ValidOptionalValue[]]>) {
    let defaultValueExpression;
    if (type.defaultValueOrFunc instanceof Function) {
      defaultValueExpression = `model.properties["${key}"].defaultValueOrFunc()`;
    } else {
      defaultValueExpression = JSON.stringify(type.defaultValueOrFunc);
    }

    const varName = `snapshotValue${key}`;

    let createExpression;
    if (isDirectlyAssignableType(type.type)) {
      createExpression = `
      this${propertyAccess(key)} = ${this.expressionForDirectlyAssignableType(key, type.type, varName)};
      `;
    } else {
      createExpression = `
      this${propertyAccess(key)} = ${this.alias(`model.properties["${key}"].type`)}.instantiate(
        ${varName},
        context,
        this
      );
      `;
    }

    const comparisonsToUndefinedValues = (type.undefinedValues ?? [undefined]).map((value) => {
      if (typeof value == "undefined") {
        return `(typeof ${varName} == "undefined")`;
      } else {
        return `(${varName} === ${JSON.stringify(value)})`;
      }
    });

    return `
      // optional type for ${key}
      let ${varName} = snapshot?.["${key}"];
      if (${comparisonsToUndefinedValues.join(" || ")}) {
        ${varName} = ${defaultValueExpression}
      }
      ${createExpression}
    `;
  }

  private assignmentExpressionForArrayType(key: string, type: ArrayType<any>): string {
    if (!isDirectlyAssignableType(type.childrenType) || type.childrenType instanceof DateType) {
      return `
        // instantiate fallback for ${key} of type ${safeTypeName(type)}
        this${propertyAccess(key)} = ${this.alias(`model.properties["${key}"]`)}.instantiate(
          snapshot?.["${key}"],
          context,
          this
        );
      `;
    }

    // Directly assignable types are primitives so we don't need to worry about setting parent/env/etc. Hence, we just
    // pass the snapshot straight through to the constructor.
    return `
      const arrayData = snapshot?.["${key}"];
      if (arrayData && arrayData.length > 0) {
        this${propertyAccess(key)} = new QuickArray(
          ${this.alias(`model.properties["${key}"]`)},
          this,
          context,
          ...arrayData
        );
      } else {
        this${propertyAccess(key)} = new QuickArray(
          ${this.alias(`model.properties["${key}"]`)},
          this,
          context
        );
      }
    `;
  }

  private assignmentExpressionForMapType(key: string, type: MapType<any>): string {
    const mapVarName = `map${key}`;
    const snapshotVarName = `snapshotValue${key}`;
    const removeUndefineds =
      type.childrenType instanceof SafeReferenceType && type.childrenType.options?.acceptsUndefined === false
        ? "if (item == null) { continue; }"
        : "";

    return `
      const ${mapVarName} = new QuickMap(${this.alias(`model.properties["${key}"]`)}, this, context);
      this${propertyAccess(key)} = ${mapVarName};
      const ${snapshotVarName} = snapshot?.["${key}"];
      if (${snapshotVarName}) {
        for (const key in ${snapshotVarName}) {
          const item = ${this.alias(`model.properties["${key}"].childrenType`)}.instantiate(
            ${snapshotVarName}[key],
            context,
            ${mapVarName}
          );
          ${removeUndefineds}
          ${mapVarName}.set(key, item);
        }
      }`;
  }

  private assignSnapshottedViewExpression(snapshottedView: SnapshottedViewMetadata) {
    const varName = `view${snapshottedView.property}`;

    let destinationProp;
    if (snapshottedView.options.createReadOnly) {
      // we're using a hydrator, so we don't store it right at the memo, and instead stash it where we'll lazily hydrate it in the getter
      destinationProp = this.alias(`Symbol.for("${this.getters.snapshottedViewInputSymbolName(snapshottedView.property)}")`);
    } else {
      // we're not using a hydrator, so we can stash the snapshotted value right into the memoized spot
      destinationProp = this.alias(`Symbol.for("${this.getters.memoSymbolName(snapshottedView.property)}")`);
    }

    const valueExpression = `snapshot?.["${snapshottedView.property}"]`;
    return `
      // setup snapshotted view for ${snapshottedView.property}
      const ${varName} = ${valueExpression};
      if (typeof ${varName} != "undefined") {
        this[${destinationProp}] = ${varName};
      }
    `;
  }

  alias(expression: string): string {
    const existing = this.aliases.get(expression);
    if (existing) {
      return existing;
    }

    const alias = `v${this.aliases.size}`;
    this.aliases.set(expression, alias);
    return alias;
  }
}

const safeTypeName = (type: IAnyType) => type.name.replace(/\n/g, "");

const innerModelType = (type: MSTIAnyType): MSTIAnyModelType | undefined => {
  if ("identifierAttribute" in type) return type as MSTIAnyModelType;
  if ("getSubTypes" in type) {
    const subTypes = (type as { getSubTypes(): MSTIAnyType[] | MSTIAnyType | null }).getSubTypes();
    if (subTypes) {
      if (Array.isArray(subTypes)) {
        return innerModelType(subTypes[0]);
      } else if (subTypes && typeof subTypes == "object") {
        return innerModelType(subTypes);
      }
    }
  }
};

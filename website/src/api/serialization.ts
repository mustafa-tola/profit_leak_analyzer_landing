/**
 * Type-level representation of a value after bigint-safe serialization.
 * At runtime `toSerializable` converts bigint to exact decimal strings.
 */
export type Jsonified<T> =
  T extends bigint
    ? string
    : T extends readonly (infer Item)[]
      ? Jsonified<Item>[]
      : T extends object
        ? { [Key in keyof T]: Jsonified<T[Key]> }
        : T;

import { Constructable, Mock, Mocked, MockedClass, MockedFunction, MockedObject, MockInstance } from "vitest";

/**
 * Type cast anything to Mock<T>
 */
export const asMock = x => x as Mock<typeof x>;

/**
 * Type casts already mocked object to Mocked<T>
 */
export const asMocked = x => x as Mocked<typeof x>;

/**
 * Type casts already mocked ClassLike to MockedClass<T>
 */
export const asMockedClass = (x: Constructable) => x as MockedClass<typeof x>;

/**
 * Type casts already mocked FunctionLike to MockedFunction<T>
 */
export const asMockedFunction = x => x as MockedFunction<typeof x>;

/**
 * Type casts already mocked object to MockedObject<T>
 */
export const asMockedObject = x => x as MockedObject<typeof x>;

/**
 * Type casts already mocked class instance to MockInstance<T>
 */
export const asMockInstance = x => x as MockInstance<typeof x>;

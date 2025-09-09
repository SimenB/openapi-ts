import type { ICodegenBiMap } from './types';

export class BiMap<Key, Value> implements ICodegenBiMap<Key, Value> {
  private map = new Map<Key, Value>();
  private reverse = new Map<Value, Key>();

  delete(key: Key): boolean {
    const value = this.map.get(key);
    if (value !== undefined) {
      this.reverse.delete(value);
    }
    return this.map.delete(key);
  }

  deleteValue(value: Value): boolean {
    const key = this.reverse.get(value);
    if (key !== undefined) {
      this.map.delete(key);
    }
    return this.reverse.delete(value);
  }

  entries(): IterableIterator<[Key, Value]> {
    return this.map.entries();
  }

  get(key: Key): Value | undefined {
    return this.map.get(key);
  }

  getKey(value: Value): Key | undefined {
    return this.reverse.get(value);
  }

  hasKey(key: Key): boolean {
    return this.map.has(key);
  }

  hasValue(value: Value): boolean {
    return this.reverse.has(value);
  }

  keys(): IterableIterator<Key> {
    return this.map.keys();
  }

  set(key: Key, value: Value): this {
    this.map.set(key, value);
    this.reverse.set(value, key);
    return this;
  }

  get size(): number {
    return this.map.size;
  }

  values(): IterableIterator<Value> {
    return this.map.values();
  }

  [Symbol.iterator](): IterableIterator<[Key, Value]> {
    return this.map[Symbol.iterator]();
  }
}

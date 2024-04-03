export interface Block<T> {
  transfer: (value: T) => T;
}

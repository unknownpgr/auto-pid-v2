import { Block } from "../core/model";

export class Delay implements Block<number> {
  private buffer: number[];
  private length = 0;
  private index = 0;

  constructor(dt: number, delay: number) {
    this.length = Math.round(delay / dt);
    this.buffer = new Array(this.length).fill(0);
  }

  transfer(value: number): number {
    const output = this.buffer[this.index];
    this.buffer[this.index] = value;
    this.index = (this.index + 1) % this.length;
    return output;
  }
}

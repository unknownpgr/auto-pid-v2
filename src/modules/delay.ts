import { Unary } from "../core/model.js";

export class Delay extends Unary {
  private buffer: number[];
  private length = 0;
  private index = 0;

  constructor(delay: number) {
    super();
    this.length = Math.round(delay / this.dt);
    this.buffer = new Array(this.length).fill(0);
  }

  transfer(value: number): number {
    const output = this.buffer[this.index];
    this.buffer[this.index] = value;
    this.index = (this.index + 1) % this.length;
    return output;
  }
}

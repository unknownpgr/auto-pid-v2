import { Block } from "../core/model";

export class IIR1 implements Block<number> {
  private a: number;
  private b: number;
  private buffer = 0;

  constructor(a: number, b: number) {
    this.a = a;
    this.b = b;
  }

  transfer(value: number): number {
    const output = this.a * value + this.b * this.buffer;
    this.buffer = output;
    return output;
  }
}

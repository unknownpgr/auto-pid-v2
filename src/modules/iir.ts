import { Unary } from "../core/model";

export class IIR1 extends Unary {
  private a: number;
  private b: number;
  private buffer = 0;

  constructor(a: number, b?: number) {
    super();
    this.a = a;
    this.b = b || 1 - a;
  }

  transfer(value: number): number {
    const output = this.a * value + this.b * this.buffer;
    this.buffer = output;
    return output;
  }
}

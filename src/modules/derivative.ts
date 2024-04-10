import { Unary } from "../core/model.js";

export class Derivative extends Unary {
  private previous = 0;

  transfer(value: number): number {
    const derivative = (value - this.previous) / this.dt;
    this.previous = value;
    return derivative;
  }
}

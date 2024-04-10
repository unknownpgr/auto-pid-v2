import { Unary } from "../core/model.js";

export class Integral extends Unary {
  private sum = 0;

  transfer(value: number): number {
    this.sum += value * this.dt;
    return this.sum;
  }
}

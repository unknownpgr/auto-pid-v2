import { Block } from "../core/model";

export class Integral implements Block<number> {
  private sum = 0;

  constructor(private readonly dt: number) {}

  transfer(value: number): number {
    this.sum += value * this.dt;
    return this.sum;
  }
}

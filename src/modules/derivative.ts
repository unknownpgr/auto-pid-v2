import { Block } from "../core/model";

export class Derivative implements Block<number> {
  private previous = 0;

  constructor(private readonly dt: number) {}

  transfer(value: number): number {
    const derivative = (value - this.previous) / this.dt;
    this.previous = value;
    return derivative;
  }
}

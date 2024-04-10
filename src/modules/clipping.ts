import { Unary } from "../core/model.js";

export class Clipping extends Unary {
  constructor(private readonly min: number, private readonly max: number) {
    super();
  }

  transfer(value: number): number {
    return Math.max(this.min, Math.min(this.max, value));
  }
}

import { Block } from "../core/model";

export class Clipping implements Block<number> {
  constructor(private readonly min: number, private readonly max: number) {}

  transfer(value: number): number {
    return Math.max(this.min, Math.min(this.max, value));
  }
}

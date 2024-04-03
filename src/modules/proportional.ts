import { Block } from "../core/model";

export class Proportional implements Block<number> {
  constructor(private readonly factor: number) {}

  transfer(value: number): number {
    return value * this.factor;
  }
}

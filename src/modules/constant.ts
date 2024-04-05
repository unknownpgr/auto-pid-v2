import { Nullary } from "../core/model";

export class Constant extends Nullary {
  constructor(private readonly value: number) {
    super();
  }

  transfer(): number {
    return this.value;
  }
}

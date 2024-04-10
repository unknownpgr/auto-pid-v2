import { Nullary } from "../core/model.js";

export class Constant extends Nullary {
  constructor(private readonly value: number) {
    super();
  }

  transfer(): number {
    return this.value;
  }

  public default(): number {
    return this.value;
  }
}

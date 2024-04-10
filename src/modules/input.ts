import { Nullary } from "../core/model.js";

export class Input extends Nullary {
  private time = 0;

  constructor(private readonly func: (t: number) => number) {
    super();
  }

  transfer(): number {
    const output = this.func(this.time);
    this.time += this.dt;
    return output;
  }
}

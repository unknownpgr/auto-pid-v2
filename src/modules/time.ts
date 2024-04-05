import { Nullary } from "../core/model";

export class Input extends Nullary {
  private time = 0;

  transfer(): number {
    this.time += this.dt;
    return this.time;
  }
}

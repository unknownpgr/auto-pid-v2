import { Block } from "../core/model";

export class Feedback implements Block<number> {
  private previousValue = 0;

  constructor(
    private readonly forward: Block<number>,
    private readonly feedback: Block<number>
  ) {}

  transfer(value: number): number {
    const output =
      this.forward.transfer(value) + this.feedback.transfer(this.previousValue);
    this.previousValue = output;
    return output;
  }
}

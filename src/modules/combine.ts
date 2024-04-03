import { Block } from "../core/model";

export class Combine implements Block<number> {
  private blocks: Block<number>[];

  constructor(...blocks: Block<number>[]) {
    this.blocks = blocks;
  }

  transfer(value: number): number {
    return this.blocks.reduce((acc, block) => block.transfer(acc), value);
  }
}

import { Binary } from "../core/model.js";

export class Multiply extends Binary {
  transfer(in1: number, in2: number): number {
    return in1 * in2;
  }
}

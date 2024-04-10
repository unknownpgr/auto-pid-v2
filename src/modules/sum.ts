import { Binary } from "../core/model.js";

export class Sum extends Binary {
  transfer(in1: number, in2: number): number {
    return in1 + in2;
  }
}

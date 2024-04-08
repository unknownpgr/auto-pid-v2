import { Binary } from "../core/model";

export class Divide extends Binary {
  transfer(in1: number, in2: number): number {
    return in1 / in2;
  }
}

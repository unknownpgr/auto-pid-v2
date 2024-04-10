import { Binary } from "../core/model.js";
export class Sum extends Binary {
    transfer(in1, in2) {
        return in1 + in2;
    }
}

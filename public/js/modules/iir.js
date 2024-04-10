import { Unary } from "../core/model.js";
export class IIR1 extends Unary {
    constructor(a, b) {
        super();
        this.buffer = 0;
        this.a = a;
        this.b = b || 1 - a;
    }
    transfer(value) {
        const output = this.a * value + this.b * this.buffer;
        this.buffer = output;
        return output;
    }
}

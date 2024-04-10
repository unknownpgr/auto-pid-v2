import { Unary } from "../core/model.js";
export class Delay extends Unary {
    constructor(delay) {
        super();
        this.length = 0;
        this.index = 0;
        this.length = Math.round(delay / this.dt);
        this.buffer = new Array(this.length).fill(0);
    }
    transfer(value) {
        const output = this.buffer[this.index];
        this.buffer[this.index] = value;
        this.index = (this.index + 1) % this.length;
        return output;
    }
}

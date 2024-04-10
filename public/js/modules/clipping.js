import { Unary } from "../core/model.js";
export class Clipping extends Unary {
    constructor(min, max) {
        super();
        this.min = min;
        this.max = max;
    }
    transfer(value) {
        return Math.max(this.min, Math.min(this.max, value));
    }
}

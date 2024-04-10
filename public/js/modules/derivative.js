import { Unary } from "../core/model.js";
export class Derivative extends Unary {
    constructor() {
        super(...arguments);
        this.previous = 0;
    }
    transfer(value) {
        const derivative = (value - this.previous) / this.dt;
        this.previous = value;
        return derivative;
    }
}

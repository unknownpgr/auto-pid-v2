import { Unary } from "../core/model.js";
export class Integral extends Unary {
    constructor() {
        super(...arguments);
        this.sum = 0;
    }
    transfer(value) {
        this.sum += value * this.dt;
        return this.sum;
    }
}

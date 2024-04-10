import { Nullary } from "../core/model.js";
export class Input extends Nullary {
    constructor(func) {
        super();
        this.func = func;
        this.time = 0;
    }
    transfer() {
        const output = this.func(this.time);
        this.time += this.dt;
        return output;
    }
}

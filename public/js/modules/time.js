import { Nullary } from "../core/model.js";
export class Input extends Nullary {
    constructor() {
        super(...arguments);
        this.time = 0;
    }
    transfer() {
        this.time += this.dt;
        return this.time;
    }
}

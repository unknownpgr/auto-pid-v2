import { Nullary } from "../core/model.js";
export class Constant extends Nullary {
    constructor(value) {
        super();
        this.value = value;
    }
    transfer() {
        return this.value;
    }
    default() {
        return this.value;
    }
}

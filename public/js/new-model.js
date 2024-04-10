function clone(a) {
    return JSON.parse(JSON.stringify(a));
}
export class OperationSpec {
    constructor(dict) {
        this.dict = dict;
    }
}
class Operation {
    constructor(id, spec) {
        this.id = id;
        this.spec = spec;
        this.inputPorts = [];
        this.outputPorts = [];
        this.state = this.spec.dict.initialState;
        for (let i = 0; i < this.spec.dict.inputs; i++) {
            this.inputPorts.push({ type: "input", operationId: this.id, index: i });
        }
        for (let i = 0; i < this.spec.dict.outputs; i++) {
            this.outputPorts.push({ type: "output", operationId: this.id, index: i });
        }
    }
    init() {
        this.state = clone(this.spec.dict.initialState);
    }
    transfer(input) {
        return this.spec.dict.transfer({ state: this.state, input });
    }
}
export class System {
    constructor() {
        this.counter = 0;
        this.operations = new Map();
        this.outputBuffer = new Map();
        this.connection = [];
    }
    addOperation(spec) {
        const id = this.counter++;
        const operation = new Operation(id, spec);
        this.operations.set(id, operation);
        return id;
    }
    removeOperation(id) {
        this.operations.delete(id);
    }
    isPortEqual(port1, port2) {
        return (port1.operationId === port2.operationId &&
            port1.index === port2.index &&
            port1.type === port2.type);
    }
    getOperation(id) {
        const operation = this.operations.get(id);
        if (!operation)
            throw new Error(`Operation not found: ${id}`);
        return {
            id: operation.id,
            name: operation.spec.dict.name,
            inputPorts: operation.inputPorts,
            outputPorts: operation.outputPorts,
        };
    }
    getOperations() {
        return Array.from(this.operations.values()).map((operation) => ({
            id: operation.id,
            name: operation.spec.dict.name,
            inputPorts: operation.inputPorts,
            outputPorts: operation.outputPorts,
        }));
    }
    isConnectable(port1, port2) {
        if (port1.type === port2.type)
            return false;
        if (port1.type === "input")
            [port1, port2] = [port2, port1];
        // If input port is already connected to another output port, it is not connectable.
        for (const connection of this.connection) {
            if (this.isPortEqual(connection.to, port2))
                return false;
        }
        return true;
    }
    connect(port1, port2) {
        if (!this.isConnectable(port1, port2))
            return;
        if (port1.type === "input")
            [port1, port2] = [port2, port1];
        this.connection.push({ from: port1, to: port2 });
    }
    disconnect(to) {
        if (to.type === "output")
            return;
        this.connection = this.connection.filter((connection) => !this.isPortEqual(connection.to, to));
    }
    getConnections() {
        return this.connection;
    }
}

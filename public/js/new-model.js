function clone(a) {
    return JSON.parse(JSON.stringify(a));
}
export const op = (spec) => spec;
class Operation {
    constructor(id, spec) {
        this.id = id;
        this.name = "";
        this._transfer = {};
        this.parameters = {};
        this.parameterDescriptions = [];
        this.inputPorts = [];
        this.outputPorts = [];
        this.dt = 0.01;
        this.state = {};
        this.init(spec);
    }
    init(spec) {
        this.name = spec.name;
        this._transfer = spec.transfer;
        this.state = clone(spec.initialState);
        // Register parameters and parameter descriptions
        for (const key in spec.parameter) {
            const parameter = spec.parameter[key];
            this.parameters[key] = parameter.defaultValue;
            const valueType = typeof parameter.defaultValue;
            if (valueType !== "number" && valueType !== "string") {
                throw new Error("Invalid parameter type");
            }
            this.parameterDescriptions.push({
                key,
                displayName: parameter.displayName,
                description: parameter.description,
                type: valueType,
            });
        }
        // Register input and output ports
        for (let i = 0; i < spec.inputs; i++) {
            this.inputPorts.push({ type: "input", operationId: this.id, index: i });
        }
        for (let i = 0; i < spec.outputs; i++) {
            this.outputPorts.push({ type: "output", operationId: this.id, index: i });
        }
    }
    transfer(input) {
        return this._transfer({
            dt: this.dt,
            state: this.state,
            parameter: this.parameters,
            input,
        });
    }
    getParameterDescriptions() {
        return this.parameterDescriptions;
    }
    setParameter(key, value) {
        const description = this.parameterDescriptions.find((description) => description.key === key);
        if (!description)
            throw new Error(`Parameter not found: ${key}`);
        if (description.type !== typeof value) {
            throw new Error(`Invalid parameter type: ${key}`);
        }
        this.parameters[key] = value;
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
        this.outputBuffer.delete(id);
        this.connection = this.connection.filter((connection) => connection.from.operationId !== id && connection.to.operationId !== id);
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
            name: operation.name,
            inputPorts: operation.inputPorts,
            outputPorts: operation.outputPorts,
        };
    }
    getOperations() {
        return Array.from(this.operations.values()).map((operation) => ({
            id: operation.id,
            name: operation.name,
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

function clone(a) {
    return JSON.parse(JSON.stringify(a));
}
export const op = (spec) => spec;
class Operation {
    constructor(id, spec) {
        this.id = id;
        this.spec = spec;
        this.name = "";
        this._transfer = {};
        this.state = {};
        this.parameters = {};
        this.parameterDescriptions = [];
        this.inputPorts = [];
        this.outputPorts = [];
        this.dt = 0.01;
        this.init();
    }
    get ports() {
        return [...this.inputPorts, ...this.outputPorts];
    }
    init() {
        this.name = this.spec.name;
        this._transfer = this.spec.transfer;
        this.state = clone(this.spec.initialState);
        // Register parameters and parameter descriptions
        this.parameters = {};
        this.parameterDescriptions = [];
        for (const key in this.spec.parameter) {
            const parameter = this.spec.parameter[key];
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
        this.inputPorts = [];
        this.outputPorts = [];
        for (let i = 0; i < this.spec.inputs; i++) {
            const portId = this.id * Math.pow(2, (i * 2));
            this.inputPorts.push({
                id: portId,
                type: "input",
                operationId: this.id,
                index: i,
            });
        }
        for (let i = 0; i < this.spec.outputs; i++) {
            const portId = this.id * Math.pow(2, (i * 2 + 1));
            this.outputPorts.push({
                id: portId,
                type: "output",
                operationId: this.id,
                index: i,
            });
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
        this.epsilon = 1e-6;
        this.counter = 1;
        this.operations = new Map();
        this.connection = [];
        this.portMapping = {}; // Input port ID -> Output port ID that it is connected to
        this.outputBuffer = {}; // Output port ID -> Buffer
        this.isInitialized = false;
    }
    addOperation(spec) {
        this.isInitialized = false;
        const id = this.counter;
        this.counter += 2;
        const operation = new Operation(id, spec);
        this.operations.set(id, operation);
        return id;
    }
    removeOperation(id) {
        this.isInitialized = false;
        this.getOperation(id).outputPorts.forEach((port) => {
            delete this.outputBuffer[port.id];
        });
        this.operations.delete(id);
        this.connection = this.connection.filter((connection) => connection.from.operationId !== id && connection.to.operationId !== id);
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
            ports: operation.ports,
        };
    }
    getOperations() {
        return Array.from(this.operations.values()).map((operation) => ({
            id: operation.id,
            name: operation.name,
            inputPorts: operation.inputPorts,
            outputPorts: operation.outputPorts,
            ports: operation.ports,
        }));
    }
    isConnectable(port1, port2) {
        if (port1.type === port2.type)
            return false;
        if (port1.type === "input")
            [port1, port2] = [port2, port1];
        // If input port is already connected to another output port, it is not connectable.
        for (const connection of this.connection) {
            if (connection.to.id === port2.id)
                return false;
        }
        return true;
    }
    connect(port1, port2) {
        this.isInitialized = false;
        if (!this.isConnectable(port1, port2))
            return;
        if (port1.type === "input")
            [port1, port2] = [port2, port1];
        this.connection.push({ from: port1, to: port2 });
    }
    disconnect(to) {
        this.isInitialized = false;
        if (to.type === "output")
            return;
        this.connection = this.connection.filter((connection) => connection.to.id !== to.id);
    }
    getConnections() {
        return this.connection;
    }
    setDt(dt) {
        this.operations.forEach((operation) => (operation.dt = dt));
    }
    setParameter(id, key, value) {
        const operation = this.operations.get(id);
        if (!operation)
            throw new Error(`Operation not found: ${id}`);
        operation.setParameter(key, value);
    }
    getParameterDescriptions(id) {
        const operation = this.operations.get(id);
        if (!operation)
            throw new Error(`Operation not found: ${id}`);
        return operation.getParameterDescriptions();
    }
    isComplete() {
        const hashPort = (port) => `${port.operationId}-${port.type}-${port.index}`;
        const connectedPorts = new Set();
        this.connection.forEach((connection) => {
            connectedPorts.add(hashPort(connection.from));
            connectedPorts.add(hashPort(connection.to));
        });
        for (const operation of this.operations.values()) {
            for (const port of operation.ports) {
                if (!connectedPorts.has(hashPort(port)))
                    return false;
            }
        }
        return true;
    }
    init() {
        if (!this.isComplete()) {
            throw new Error("System is not complete");
        }
        this.operations.forEach((operation) => {
            operation.init();
            operation.outputPorts.forEach((port) => {
                this.outputBuffer[port.id] = this.epsilon;
            });
        });
        this.connection.forEach(({ from, to }) => {
            this.portMapping[to.id] = from.id;
        });
        this.isInitialized = true;
    }
    update() {
        if (!this.isInitialized)
            throw new Error("System is not initialized");
        this.operations.forEach((operation) => {
            const input = [];
            operation.inputPorts.forEach((port) => {
                const outputPortId = this.portMapping[port.id];
                const outputBuffer = this.outputBuffer[outputPortId];
                input.push(outputBuffer);
            });
            const output = operation.transfer(input);
            operation.outputPorts.forEach((port, i) => {
                this.outputBuffer[port.id] = output[i];
            });
        });
    }
}

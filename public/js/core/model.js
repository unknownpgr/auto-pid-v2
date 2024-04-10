export const EPSILON = 1e-6;
export class Operation {
    constructor() {
        this.dt = 0.01;
        this.id = Operation.counter++ * 3;
    }
    setDt(dt) {
        if (dt <= 0)
            throw new Error("dt must be greater than 0");
        if (dt < EPSILON)
            throw new Error("dt is too small");
        this.dt = dt;
    }
    getDt() {
        return this.dt;
    }
    getId() {
        return this.id;
    }
}
Operation.counter = 0;
export class Nullary extends Operation {
    get out() {
        return this.getId();
    }
    default() {
        return 0;
    }
}
export class Unary extends Operation {
    get out() {
        return this.getId();
    }
    get in() {
        return this.getId() + 1;
    }
}
export class Binary extends Operation {
    get out() {
        return this.getId();
    }
    get in1() {
        return this.getId() + 1;
    }
    get in2() {
        return this.getId() + 2;
    }
}
export class Output extends Operation {
    constructor(name) {
        super();
        this.data = [];
        this.name = name;
    }
    get in() {
        return this.getId() + 1;
    }
    transfer(value) {
        this.data.push(value);
    }
    report() {
        return { title: this.name, data: this.data };
    }
}
export class System {
    constructor() {
        this.edge = new Map();
        this.operations = new Map();
        this.nodeEdgeMapping = new Map(); // node -> edge
        this.dt = 0.01;
        this.isInitialized = false;
        this.output = new Map(); // edge -> value
    }
    getOperationId(nodeId) {
        return Math.floor(nodeId / 3) * 3;
    }
    isOutputNode(nodeId) {
        return nodeId % 3 === 0;
    }
    hasOperation(id) {
        return this.operations.has(id);
    }
    hasNode(nodeId) {
        return this.hasOperation(this.getOperationId(nodeId));
    }
    isConnected(nodeId) {
        for (const [from, to] of this.edge) {
            if (to.includes(nodeId))
                return true;
            if (from === nodeId)
                return true;
        }
        return false;
    }
    isNullary(operation) {
        return operation instanceof Nullary;
    }
    isUnary(operation) {
        return operation instanceof Unary;
    }
    isBinary(operation) {
        return operation instanceof Binary;
    }
    isOutput(operation) {
        return operation instanceof Output;
    }
    check() {
        for (const operation of this.operations.values()) {
            if (this.isNullary(operation)) {
                if (!this.isConnected(operation.out))
                    throw new Error(`Node ${operation.out} is not connected`);
            }
            else if (this.isUnary(operation)) {
                if (!this.isConnected(operation.in))
                    throw new Error(`Node ${operation.in} is not connected`);
                if (!this.isConnected(operation.out))
                    throw new Error(`Node ${operation.out} is not connected`);
            }
            else if (this.isBinary(operation)) {
                if (!this.isConnected(operation.in1))
                    throw new Error(`Node ${operation.in1} is not connected`);
                if (!this.isConnected(operation.in2))
                    throw new Error(`Node ${operation.in2} is not connected`);
                if (!this.isConnected(operation.out))
                    throw new Error(`Node ${operation.out} is not connected`);
            }
            else if (this.isOutput(operation)) {
                if (!this.isConnected(operation.in))
                    throw new Error(`Node ${operation.in} is not connected`);
            }
        }
    }
    register(...operations) {
        if (this.isInitialized)
            throw new Error("System is already initialized");
        for (const operation of operations) {
            if (this.hasOperation(operation.getId()))
                throw new Error(`Operation ${operation.getId()} already exists`);
            this.operations.set(operation.getId(), operation);
        }
    }
    connect(from, to) {
        if (this.isInitialized)
            throw new Error("System is already initialized");
        // Check if the nodes exist
        if (!this.hasNode(from))
            throw new Error(`Node ${from} does not exist`);
        if (!this.hasNode(to))
            throw new Error(`Node ${to} does not exist`);
        // Check if the node types are correct
        if (!this.isOutputNode(from))
            throw new Error(`Node ${from} is not an output node`);
        if (this.isOutputNode(to))
            throw new Error(`Node ${to} is not an input node`);
        // Check if to node is already connected
        if (this.isConnected(to))
            throw new Error(`Node ${to} is already connected`);
        // Connect the nodes
        if (this.edge.has(from)) {
            this.edge.get(from).push(to);
        }
        else {
            this.edge.set(from, [to]);
        }
    }
    setDt(dt) {
        if (this.isInitialized)
            throw new Error("System is already initialized");
        if (dt <= 0)
            throw new Error("dt must be greater than 0");
        if (dt < EPSILON)
            throw new Error("dt is too small");
        this.dt = dt;
    }
    init() {
        if (this.isInitialized)
            throw new Error("System is already initialized");
        this.check();
        let id = 0;
        for (const [from, to] of this.edge) {
            this.nodeEdgeMapping.set(from, id);
            for (const t of to) {
                this.nodeEdgeMapping.set(t, id);
            }
            this.output.set(id, 0);
            id++;
        }
        for (const operation of this.operations.values()) {
            operation.setDt(this.dt);
        }
        for (const operation of this.operations.values()) {
            if (this.isNullary(operation)) {
                const edge = this.nodeEdgeMapping.get(operation.out);
                this.output.set(edge, operation.default());
            }
        }
        this.isInitialized = true;
    }
    step() {
        if (!this.isInitialized)
            throw new Error("System is not initialized");
        const output = new Map();
        for (const operation of this.operations.values()) {
            let outputValue = 0;
            if (this.isOutput(operation)) {
                const edge = this.nodeEdgeMapping.get(operation.in);
                const input = this.output.get(edge);
                operation.transfer(input);
                continue;
            }
            if (this.isNullary(operation)) {
                outputValue = operation.transfer();
            }
            else if (this.isUnary(operation)) {
                const edge = this.nodeEdgeMapping.get(operation.in);
                const input = this.output.get(edge);
                outputValue = operation.transfer(input);
            }
            else if (this.isBinary(operation)) {
                const edge1 = this.nodeEdgeMapping.get(operation.in1);
                const edge2 = this.nodeEdgeMapping.get(operation.in2);
                const input1 = this.output.get(edge1);
                const input2 = this.output.get(edge2);
                outputValue = operation.transfer(input1, input2);
            }
            const op = operation;
            const outputNode = op.out;
            const edge = this.nodeEdgeMapping.get(outputNode);
            output.set(edge, outputValue);
        }
        this.output = output;
    }
    run(duration) {
        const steps = Math.floor(duration / this.dt);
        for (let i = 0; i < steps; i++)
            this.step();
    }
    report() {
        const reports = [];
        for (const operation of this.operations.values()) {
            if (this.isOutput(operation)) {
                reports.push(operation.report());
            }
        }
        return reports;
    }
}

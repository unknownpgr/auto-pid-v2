export const EPSILON = 1e-6;

export abstract class Operation {
  private static counter = 0;

  protected dt: number = 0.01;
  private id: number;

  constructor() {
    this.id = Operation.counter++ * 3;
  }

  public setDt(dt: number) {
    if (dt <= 0) throw new Error("dt must be greater than 0");
    if (dt < EPSILON) throw new Error("dt is too small");
    this.dt = dt;
  }

  public getDt() {
    return this.dt;
  }

  public getId() {
    return this.id;
  }
}

export abstract class Nullary<Out = number> extends Operation {
  abstract transfer(): Out;

  get out() {
    return this.getId();
  }
}

export abstract class Unary<In = number, Out = number> extends Operation {
  abstract transfer(value: In): Out;

  get out() {
    return this.getId();
  }

  get in() {
    return this.getId() + 1;
  }
}

export abstract class Binary<
  In1 = number,
  In2 = number,
  Out = number
> extends Operation {
  abstract transfer(value1: In1, value2: In2): Out;

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
  private readonly name: string;
  private data: number[] = [];

  constructor(name: string) {
    super();
    this.name = name;
  }

  get in() {
    return this.getId() + 1;
  }

  public transfer(value: number): void {
    this.data.push(value);
  }

  public report(): Report {
    return { title: this.name, data: this.data };
  }
}

export interface Report {
  title: string;
  data: number[];
}

export class System {
  private dt: number = 0.01;
  private readonly edge: Map<number, number[]> = new Map();
  private readonly operations: Map<number, Operation> = new Map();
  private readonly nodeEdgeMapping: Map<number, number> = new Map(); // node -> edge
  private isInitialized: boolean = false;
  private readonly history: Map<number, Report> = new Map();
  private output: Map<number, number> = new Map(); // edge -> value

  private getOperationId(nodeId: number) {
    return Math.floor(nodeId / 3) * 3;
  }

  private isOutputNode(nodeId: number) {
    return nodeId % 3 === 0;
  }

  private hasOperation(id: number) {
    return this.operations.has(id);
  }

  private hasNode(nodeId: number) {
    return this.hasOperation(this.getOperationId(nodeId));
  }

  private isConnected(nodeId: number) {
    for (const [from, to] of this.edge) {
      if (to.includes(nodeId)) return true;
      if (from === nodeId) return true;
    }
    return false;
  }

  private isNullary(operation: Operation): operation is Nullary {
    return operation instanceof Nullary;
  }

  private isUnary(operation: Operation): operation is Unary {
    return operation instanceof Unary;
  }

  private isBinary(operation: Operation): operation is Binary {
    return operation instanceof Binary;
  }

  private isOutput(operation: Operation): operation is Output {
    return operation instanceof Output;
  }

  private check() {
    for (const operation of this.operations.values()) {
      if (this.isNullary(operation)) {
        if (!this.isConnected(operation.out))
          throw new Error(`Node ${operation.out} is not connected`);
      } else if (this.isUnary(operation)) {
        if (!this.isConnected(operation.in))
          throw new Error(`Node ${operation.in} is not connected`);
        if (!this.isConnected(operation.out))
          throw new Error(`Node ${operation.out} is not connected`);
      } else if (this.isBinary(operation)) {
        if (!this.isConnected(operation.in1))
          throw new Error(`Node ${operation.in1} is not connected`);
        if (!this.isConnected(operation.in2))
          throw new Error(`Node ${operation.in2} is not connected`);
        if (!this.isConnected(operation.out))
          throw new Error(`Node ${operation.out} is not connected`);
      } else if (this.isOutput(operation)) {
        if (!this.isConnected(operation.in))
          throw new Error(`Node ${operation.in} is not connected`);
      }
    }
  }

  public register(...operations: Operation[]) {
    if (this.isInitialized) throw new Error("System is already initialized");
    for (const operation of operations) {
      if (this.hasOperation(operation.getId()))
        throw new Error(`Operation ${operation.getId()} already exists`);
      this.operations.set(operation.getId(), operation);
    }
  }

  public connect(from: number, to: number) {
    if (this.isInitialized) throw new Error("System is already initialized");

    // Check if the nodes exist
    if (!this.hasNode(from)) throw new Error(`Node ${from} does not exist`);
    if (!this.hasNode(to)) throw new Error(`Node ${to} does not exist`);

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
      this.edge.get(from)!.push(to);
    } else {
      this.edge.set(from, [to]);
    }
  }

  public probe(nodeId: number, title: string) {
    if (this.isInitialized) throw new Error("System is already initialized");
    if (!this.hasNode(nodeId)) throw new Error(`Node ${nodeId} does not exist`);
    if (!this.isOutputNode(nodeId))
      throw new Error(`Node ${nodeId} is not an output node`);
    if (this.history.has(nodeId))
      throw new Error(`Node ${nodeId} is already probed`);
    this.history.set(nodeId, { title, data: [] });
  }

  public setDt(dt: number) {
    if (this.isInitialized) throw new Error("System is already initialized");
    if (dt <= 0) throw new Error("dt must be greater than 0");
    if (dt < EPSILON) throw new Error("dt is too small");
    this.dt = dt;
  }

  public init() {
    if (this.isInitialized) throw new Error("System is already initialized");
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
    this.isInitialized = true;
  }

  public step() {
    if (!this.isInitialized) throw new Error("System is not initialized");
    const output = new Map<number, number>();
    for (const operation of this.operations.values()) {
      let outputValue = 0;
      if (this.isOutput(operation)) {
        const edge = this.nodeEdgeMapping.get(operation.in)!;
        const input = this.output.get(edge)!;
        operation.transfer(input);
        continue;
      }
      if (this.isNullary(operation)) {
        outputValue = operation.transfer();
      } else if (this.isUnary(operation)) {
        const edge = this.nodeEdgeMapping.get(operation.in)!;
        const input = this.output.get(edge)!;
        outputValue = operation.transfer(input);
      } else if (this.isBinary(operation)) {
        const edge1 = this.nodeEdgeMapping.get(operation.in1)!;
        const edge2 = this.nodeEdgeMapping.get(operation.in2)!;
        const input1 = this.output.get(edge1)!;
        const input2 = this.output.get(edge2)!;
        outputValue = operation.transfer(input1, input2);
      }

      const op = operation as Nullary;
      const outputNode = op.out;
      const edge = this.nodeEdgeMapping.get(outputNode)!;
      output.set(edge, outputValue);
      if (this.history.has(outputNode)) {
        this.history.get(outputNode)!.data.push(outputValue);
      }
    }
    this.output = output;
  }

  public run(duration: number) {
    const steps = Math.floor(duration / this.dt);
    for (let i = 0; i < steps; i++) this.step();
  }

  public report() {
    const reports: Report[] = [];
    for (const report of this.history.values()) {
      reports.push(report);
    }
    for (const operation of this.operations.values()) {
      if (this.isOutput(operation)) {
        reports.push(operation.report());
      }
    }
    return reports;
  }
}

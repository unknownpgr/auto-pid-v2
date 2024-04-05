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

  public getOutputNode() {
    return this.getId();
  }
}

export abstract class Nullary<Out = number> extends Operation {
  abstract transfer(): Out;
}

export abstract class Unary<In = number, Out = number> extends Operation {
  abstract transfer(value: In): Out;

  public getInputNode() {
    return this.getId() + 1;
  }
}

export abstract class Binary<
  In1 = number,
  In2 = number,
  Out = number
> extends Operation {
  abstract transfer(value1: In1, value2: In2): Out;

  public getInputNode1() {
    return this.getId() + 1;
  }

  public getInputNode2() {
    return this.getId() + 2;
  }
}

export interface Report {
  title: string;
  data: number[];
}

export class System {
  private readonly edge: Map<number, number[]> = new Map();
  private readonly operations: Map<number, Operation> = new Map();
  private readonly nodeEdgeMapping: Map<number, number> = new Map();
  private readonly isInitialized: boolean = false;
  private readonly history: Map<number, Report> = new Map();
  private output: Map<number, number> = new Map();

  private getOperationId(nodeId: number) {
    return Math.floor(nodeId / 3);
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

  private check() {
    for (const operation of this.operations.values()) {
      if (!this.isConnected(operation.getOutputNode()))
        throw new Error(`Node ${operation.getOutputNode()} is not connected`);
      if (this.isUnary(operation)) {
        if (!this.isConnected(operation.getInputNode()))
          throw new Error(`Node ${operation.getInputNode()} is not connected`);
      }
      if (this.isBinary(operation)) {
        if (!this.isConnected(operation.getInputNode1()))
          throw new Error(`Node ${operation.getInputNode1()} is not connected`);
        if (!this.isConnected(operation.getInputNode2()))
          throw new Error(`Node ${operation.getInputNode2()} is not connected`);
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
    if (!this.hasNode(from)) throw new Error(`Node ${from} does not exist`);
    if (!this.hasNode(to)) throw new Error(`Node ${to} does not exist`);
    if (!this.isOutputNode(from))
      throw new Error(`Node ${from} is not an output node`);
    if (this.isOutputNode(to))
      throw new Error(`Node ${to} is not an input node`);
    if (this.isConnected(to))
      throw new Error(`Node ${to} is already connected`);
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
  }

  public step() {
    if (!this.isInitialized) throw new Error("System is not initialized");
    const output = new Map<number, number>();
    for (const operation of this.operations.values()) {
      const outputNode = operation.getOutputNode();
      let outputValue = 0;
      if (this.isNullary(operation)) {
        outputValue = operation.transfer();
      }
      if (this.isUnary(operation)) {
        const edge = this.nodeEdgeMapping.get(operation.getInputNode())!;
        const input = this.output.get(edge)!;
        outputValue = operation.transfer(input);
      }
      if (this.isBinary(operation)) {
        const edge1 = this.nodeEdgeMapping.get(operation.getInputNode1())!;
        const edge2 = this.nodeEdgeMapping.get(operation.getInputNode2())!;
        const input1 = this.output.get(edge1)!;
        const input2 = this.output.get(edge2)!;
        outputValue = operation.transfer(input1, input2);
      }
      output.set(outputNode, outputValue);
      if (this.history.has(outputNode)) {
        this.history.get(outputNode)!.data.push(outputValue);
      }
    }
    this.output = output;
  }

  public report() {
    return Array.from(this.history.values());
  }
}

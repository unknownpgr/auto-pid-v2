type Number0 = 0;
type Number1 = 1;
type Number2 = 2;
type Number3 = 3;
type Number4 = 4;
type Number5 = 5;
type Number6 = 6;
type Number7 = 7;
type Number8 = 8;
type Number9 = 9;
type Number10 = 10;
type NumberN =
  | Number0
  | Number1
  | Number2
  | Number3
  | Number4
  | Number5
  | Number6
  | Number7
  | Number8
  | Number9
  | Number10;

type Array0<T = number> = readonly [];
type Array1<T = number> = readonly [T];
type Array2<T = number> = readonly [T, T];
type Array3<T = number> = readonly [T, T, T];
type Array4<T = number> = readonly [T, T, T, T];
type Array5<T = number> = readonly [T, T, T, T, T];
type Array6<T = number> = readonly [T, T, T, T, T, T];
type Array7<T = number> = readonly [T, T, T, T, T, T, T];
type Array8<T = number> = readonly [T, T, T, T, T, T, T, T];
type Array9<T = number> = readonly [T, T, T, T, T, T, T, T, T];
type Array10<T = number> = readonly [T, T, T, T, T, T, T, T, T, T];

type ArrayOf<T = number> = {
  0: Array0<T>;
  1: Array1<T>;
  2: Array2<T>;
  3: Array3<T>;
  4: Array4<T>;
  5: Array5<T>;
  6: Array6<T>;
  7: Array7<T>;
  8: Array8<T>;
  9: Array9<T>;
  10: Array10<T>;
};

function clone<T>(a: T): T {
  return JSON.parse(JSON.stringify(a));
}

type Transfer<S, P, N extends NumberN, M extends NumberN> = (p: {
  dt: number;
  state: S;
  parameter: P;
  input: ArrayOf[N];
}) => ArrayOf[M];

type ParameterSpec<V extends number | string = number> = {
  [key: string]: {
    displayName: string;
    description: string;
    defaultValue: V;
  };
};

type Parameter<P extends ParameterSpec> = {
  [K in keyof P]: P[K]["defaultValue"];
};

export interface OperationSpec<
  S,
  P extends ParameterSpec,
  N extends NumberN,
  M extends NumberN
> {
  name: string;
  inputs: N;
  outputs: M;
  initialState: S;
  parameter: P;
  transfer: Transfer<S, Parameter<P>, N, M>;
}

export const op = <
  S = void,
  P extends ParameterSpec<any> = {},
  N extends NumberN = NumberN,
  M extends NumberN = NumberN
>(
  spec: OperationSpec<S, P, N, M>
) => spec;

type PortType = "input" | "output";

export interface Port {
  type: PortType;
  id: number;
  operationId: number;
  index: number;
}

interface Connection {
  from: Port;
  to: Port;
}

interface ParameterDescription {
  key: string;
  displayName: string;
  description: string;
  type: "number" | "string";
}

class Operation<
  S,
  P extends ParameterSpec,
  N extends NumberN = NumberN,
  M extends NumberN = NumberN
> {
  public name: string = "";
  private _transfer: Transfer<S, Parameter<P>, N, M> = {} as any;
  private state: S = {} as any;
  private parameters: Parameter<P> = {} as any;
  private parameterDescriptions: ParameterDescription[] = [];
  public inputPorts: Port[] = [];
  public outputPorts: Port[] = [];
  public dt = 0.01;

  constructor(
    public readonly id: number,
    private readonly spec: OperationSpec<S, P, N, M>
  ) {
    this.init();
  }

  public get ports() {
    return [...this.inputPorts, ...this.outputPorts];
  }

  public init() {
    this.name = this.spec.name;
    this._transfer = this.spec.transfer;
    this.state = clone(this.spec.initialState);

    // Register parameters and parameter descriptions
    this.parameters = {} as any;
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
      const portId = this.id * 2 ** (i * 2);
      this.inputPorts.push({
        id: portId,
        type: "input",
        operationId: this.id,
        index: i,
      });
    }
    for (let i = 0; i < this.spec.outputs; i++) {
      const portId = this.id * 2 ** (i * 2 + 1);
      this.outputPorts.push({
        id: portId,
        type: "output",
        operationId: this.id,
        index: i,
      });
    }
  }

  public transfer(input: ArrayOf[N]): ArrayOf[M] {
    return this._transfer({
      dt: this.dt,
      state: this.state,
      parameter: this.parameters,
      input,
    });
  }

  public getParameterDescriptions() {
    return this.parameterDescriptions;
  }

  public setParameter(key: string, value: number | string) {
    const description = this.parameterDescriptions.find(
      (description) => description.key === key
    );
    if (!description) throw new Error(`Parameter not found: ${key}`);
    if (description.type !== typeof value) {
      throw new Error(`Invalid parameter type: ${key}`);
    }
    (this.parameters as any)[key] = value;
  }
}

export interface OperationDTO {
  id: number;
  name: string;
  inputPorts: Port[];
  outputPorts: Port[];
  ports: Port[];
}

export class System {
  private epsilon = 1e-6;
  private counter = 1;
  private operations: Map<number, Operation<any, any>> = new Map();
  private connection: Connection[] = [];
  private portMapping: { [inputPortId: number]: number } = {}; // Input port ID -> Output port ID that it is connected to
  private outputBuffer: { [outputPortId: number]: number } = {}; // Output port ID -> Buffer
  private isInitialized = false;

  public addOperation(spec: OperationSpec<any, any, any, any>): number {
    this.isInitialized = false;
    const id = this.counter;
    this.counter += 2;
    const operation = new Operation(id, spec);
    this.operations.set(id, operation);
    return id;
  }

  public removeOperation(id: number) {
    this.isInitialized = false;
    this.getOperation(id).outputPorts.forEach((port) => {
      delete this.outputBuffer[port.id];
    });
    this.operations.delete(id);
    this.connection = this.connection.filter(
      (connection) =>
        connection.from.operationId !== id && connection.to.operationId !== id
    );
  }

  public getOperation(id: number): OperationDTO {
    const operation = this.operations.get(id);
    if (!operation) throw new Error(`Operation not found: ${id}`);
    return {
      id: operation.id,
      name: operation.name,
      inputPorts: operation.inputPorts,
      outputPorts: operation.outputPorts,
      ports: operation.ports,
    };
  }

  public getOperations(): OperationDTO[] {
    return Array.from(this.operations.values()).map((operation) => ({
      id: operation.id,
      name: operation.name,
      inputPorts: operation.inputPorts,
      outputPorts: operation.outputPorts,
      ports: operation.ports,
    }));
  }

  public isConnectable(port1: Port, port2: Port) {
    if (port1.type === port2.type) return false;
    if (port1.type === "input") [port1, port2] = [port2, port1];

    // If input port is already connected to another output port, it is not connectable.
    for (const connection of this.connection) {
      if (connection.to.id === port2.id) return false;
    }

    return true;
  }

  public connect(port1: Port, port2: Port) {
    this.isInitialized = false;
    if (!this.isConnectable(port1, port2)) return;
    if (port1.type === "input") [port1, port2] = [port2, port1];
    this.connection.push({ from: port1, to: port2 });
  }

  public disconnect(to: Port) {
    this.isInitialized = false;
    if (to.type === "output") return;
    this.connection = this.connection.filter(
      (connection) => connection.to.id !== to.id
    );
  }

  public getConnections(): Connection[] {
    return this.connection;
  }

  public setDt(dt: number) {
    this.operations.forEach((operation) => (operation.dt = dt));
  }

  public setParameter(id: number, key: string, value: number | string) {
    const operation = this.operations.get(id);
    if (!operation) throw new Error(`Operation not found: ${id}`);
    operation.setParameter(key, value);
  }

  public getParameterDescriptions(id: number) {
    const operation = this.operations.get(id);
    if (!operation) throw new Error(`Operation not found: ${id}`);
    return operation.getParameterDescriptions();
  }

  public isComplete() {
    const hashPort = (port: Port) =>
      `${port.operationId}-${port.type}-${port.index}`;
    const connectedPorts = new Set<string>();
    this.connection.forEach((connection) => {
      connectedPorts.add(hashPort(connection.from));
      connectedPorts.add(hashPort(connection.to));
    });
    for (const operation of this.operations.values()) {
      for (const port of operation.ports) {
        if (!connectedPorts.has(hashPort(port))) return false;
      }
    }
    return true;
  }

  public init() {
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

  public update() {
    if (!this.isInitialized) throw new Error("System is not initialized");
    this.operations.forEach((operation) => {
      const input: number[] = [];
      operation.inputPorts.forEach((port) => {
        const outputPortId = this.portMapping[port.id];
        const outputBuffer = this.outputBuffer[outputPortId];
        input.push(outputBuffer);
      });
      const output = operation.transfer(input as any);
      operation.outputPorts.forEach((port, i) => {
        this.outputBuffer[port.id] = output[i];
      });
    });
  }
}

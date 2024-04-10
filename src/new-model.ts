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

type Array0 = readonly [];
type Array1 = readonly [number];
type Array2 = readonly [number, number];
type Array3 = readonly [number, number, number];
type Array4 = readonly [number, number, number, number];
type Array5 = readonly [number, number, number, number, number];
type Array6 = readonly [number, number, number, number, number, number];
type Array7 = readonly [number, number, number, number, number, number, number];
type Array8 = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number
];
type Array9 = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number
];
type Array10 = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number
];

type ArrayOf = {
  0: Array0;
  1: Array1;
  2: Array2;
  3: Array3;
  4: Array4;
  5: Array5;
  6: Array6;
  7: Array7;
  8: Array8;
  9: Array9;
  10: Array10;
};

type FunctionKNM<K extends NumberN, N extends NumberN, M extends NumberN> = ({
  state,
  input,
}: {
  state: ArrayOf[K];
  input: ArrayOf[N];
}) => ArrayOf[M];

function clone<T>(a: T): T {
  return JSON.parse(JSON.stringify(a));
}

export class OperationSpec<
  NumState extends NumberN = NumberN,
  NumInput extends NumberN = NumberN,
  NumOutput extends NumberN = NumberN
> {
  constructor(
    public readonly dict: {
      name: string;
      states: NumState;
      inputs: NumInput;
      outputs: NumOutput;
      initialState: ArrayOf[NumState];
      transfer: FunctionKNM<NumState, NumInput, NumOutput>;
    }
  ) {}
}

type PortType = "input" | "output";

export interface Port {
  type: PortType;
  operationId: number;
  index: number;
}

interface Connection {
  from: Port;
  to: Port;
}

class Operation<
  NumState extends NumberN = NumberN,
  NumInput extends NumberN = NumberN,
  NumOutput extends NumberN = NumberN
> {
  private state: ArrayOf[NumState];
  public inputPorts: Port[] = [];
  public outputPorts: Port[] = [];

  constructor(
    public readonly id: number,
    public readonly spec: OperationSpec<NumState, NumInput, NumOutput>
  ) {
    this.state = this.spec.dict.initialState;
    for (let i = 0; i < this.spec.dict.inputs; i++) {
      this.inputPorts.push({ type: "input", operationId: this.id, index: i });
    }
    for (let i = 0; i < this.spec.dict.outputs; i++) {
      this.outputPorts.push({ type: "output", operationId: this.id, index: i });
    }
  }

  public init() {
    this.state = clone(this.spec.dict.initialState);
  }

  public transfer(input: ArrayOf[NumInput]): ArrayOf[NumOutput] {
    return this.spec.dict.transfer({ state: this.state, input });
  }
}

export interface OperationDTO {
  id: number;
  name: string;
  inputPorts: Port[];
  outputPorts: Port[];
}

export class System {
  private counter = 0;
  private operations: Map<number, Operation> = new Map();
  private outputBuffer: Map<number, ArrayOf[NumberN]> = new Map();
  private connection: Connection[] = [];

  public addOperation(spec: OperationSpec<any, any, any>): number {
    const id = this.counter++;
    const operation = new Operation(id, spec);
    this.operations.set(id, operation);
    return id;
  }

  public removeOperation(id: number) {
    this.operations.delete(id);
  }

  private isPortEqual(port1: Port, port2: Port) {
    return (
      port1.operationId === port2.operationId &&
      port1.index === port2.index &&
      port1.type === port2.type
    );
  }

  public getOperation(id: number): OperationDTO {
    const operation = this.operations.get(id);
    if (!operation) throw new Error(`Operation not found: ${id}`);
    return {
      id: operation.id,
      name: operation.spec.dict.name,
      inputPorts: operation.inputPorts,
      outputPorts: operation.outputPorts,
    };
  }

  public getOperations(): OperationDTO[] {
    return Array.from(this.operations.values()).map((operation) => ({
      id: operation.id,
      name: operation.spec.dict.name,
      inputPorts: operation.inputPorts,
      outputPorts: operation.outputPorts,
    }));
  }

  public isConnectable(port1: Port, port2: Port) {
    if (port1.type === port2.type) return false;
    if (port1.type === "input") [port1, port2] = [port2, port1];

    // If input port is already connected to another output port, it is not connectable.
    for (const connection of this.connection) {
      if (this.isPortEqual(connection.to, port2)) return false;
    }

    return true;
  }

  public connect(port1: Port, port2: Port) {
    if (!this.isConnectable(port1, port2)) return;
    if (port1.type === "input") [port1, port2] = [port2, port1];
    this.connection.push({ from: port1, to: port2 });
  }

  public disconnect(to: Port) {
    if (to.type === "output") return;
    this.connection = this.connection.filter(
      (connection) => !this.isPortEqual(connection.to, to)
    );
  }

  public getConnections(): Connection[] {
    return this.connection;
  }
}

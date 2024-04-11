import { OperationDTO, OperationSpec, Port, System } from "./new-model.js";

export interface Vector {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export class GraphicSystem extends System {
  private readonly operationRects: Map<number, Rect> = new Map();
  private readonly operationFlip: Map<number, boolean> = new Map();
  private readonly opWidth = 100;
  private readonly portGap = 20;
  private readonly nearThresh = 10;

  private mouseX = 0;
  private mouseY = 0;
  private selectedObject: OperationDTO | Port | null = null;

  public addOperation(spec: OperationSpec<any, any, any, any>): number {
    const id = super.addOperation(spec);
    this.selectedObject = this.getOperation(id);
    return id;
  }

  public getOperationRect(id: number): Rect {
    const rect = this.operationRects.get(id);
    if (rect) return rect;
    const op = this.getOperation(id);
    const m = Math.max(op.inputPorts.length, op.outputPorts.length);
    const h = m * this.portGap;
    const newRect = { x: 0, y: 0, w: this.opWidth, h };
    this.operationRects.set(id, newRect);
    return newRect;
  }

  public setOperationPosition(id: number, x: number, y: number) {
    const rect = this.operationRects.get(id);
    if (!rect) return;
    const newX = x - rect.w / 2;
    const newY = y - rect.h / 2;
    const newRect = { x: newX, y: newY, w: this.opWidth, h: rect.h };
    this.operationRects.set(id, newRect);
  }

  private isOperationFlipped(id: number): boolean {
    const flipped = this.operationFlip.get(id);
    return flipped || false;
  }

  public flipOperation(id: number) {
    const flipped = this.operationFlip.get(id);
    this.operationFlip.set(id, !flipped);
  }

  public getPortPosition(port: Port): Vector {
    const op = this.getOperation(port.operationId);
    const r = this.getOperationRect(port.operationId);
    const m = Math.max(op.inputPorts.length, op.outputPorts.length);
    const x =
      (port.type === "input") !== this.isOperationFlipped(port.operationId)
        ? r.x
        : r.x + r.w;
    const y =
      port.type === "input"
        ? r.y +
          (this.portGap * (port.index * 2 - op.inputPorts.length + m + 1)) / 2
        : r.y +
          (this.portGap * (port.index * 2 - op.outputPorts.length + m + 1)) / 2;

    return { x, y };
  }

  public getPortDirection(port: Port): number {
    return (port.type === "input") === this.isOperationFlipped(port.operationId)
      ? 1
      : -1;
  }

  private isOperation(operation: any): operation is OperationDTO {
    if (!operation) return false;
    return operation.inputPorts !== undefined;
  }

  public isPort(port: any): port is Port {
    if (!port) return false;
    return port.operationId !== undefined;
  }

  public setMousePosition(x: number, y: number) {
    this.mouseX = x;
    this.mouseY = y;
    const op = this.getSelectedOperation();
    if (op) this.setOperationPosition(op.id, x, y);
  }

  public getNearObject(): OperationDTO | Port | null {
    let minDist = this.nearThresh;
    let nearObject: OperationDTO | Port | null = null;
    for (const operation of this.getOperations()) {
      const ports = [...operation.inputPorts, ...operation.outputPorts];
      for (const port of ports) {
        const pos = this.getPortPosition(port);
        const dist = Math.hypot(pos.x - this.mouseX, pos.y - this.mouseY);
        if (dist < minDist) {
          minDist = dist;
          nearObject = port;
        }
      }
    }
    if (nearObject) return nearObject;
    for (const operation of this.getOperations()) {
      const rect = this.getOperationRect(operation.id);
      const cx = rect.x + this.opWidth / 2;
      const cy = rect.y + rect.h / 2;
      const dist = Math.hypot(cx - this.mouseX, cy - this.mouseY);
      if (dist < minDist) {
        minDist = dist;
        nearObject = operation;
      }
    }
    return nearObject;
  }

  public getCursorPosition() {
    const near = this.getNearObject();

    if (!near) return [this.mouseX, this.mouseY];

    if (!this.selectedObject && this.isOperation(near)) {
      const rect = this.getOperationRect(near.id);
      return [rect.x + rect.w / 2, rect.y + rect.h / 2];
    }

    if (!this.selectedObject && this.isPort(near)) {
      const pos = this.getPortPosition(near);
      return [pos.x, pos.y];
    }

    if (
      this.selectedObject &&
      this.isPort(this.selectedObject) &&
      this.isPort(near) &&
      this.isConnectable(this.selectedObject, near)
    ) {
      const pos = this.getPortPosition(near);
      return [pos.x, pos.y];
    }

    return [this.mouseX, this.mouseY];
  }

  public getSelectedPort() {
    if (this.selectedObject && this.isPort(this.selectedObject)) {
      return this.selectedObject;
    }
    return null;
  }

  public getSelectedOperation() {
    if (this.selectedObject && this.isOperation(this.selectedObject)) {
      return this.selectedObject;
    }
    return null;
  }

  public click() {
    const near = this.getNearObject();

    if (!this.selectedObject && !near) return;

    // Select operation or port
    if (!this.selectedObject) {
      this.selectedObject = near;
      return;
    }

    // Release selected operation
    if (this.isOperation(this.selectedObject)) {
      this.selectedObject = null;
      return;
    }

    // Release selected port
    if (!this.isPort(near)) {
      this.selectedObject = null;
      return;
    }

    // Connect ports
    this.connect(this.selectedObject, near);
    this.selectedObject = null;
  }

  public delete() {
    const port = this.getSelectedPort();
    if (port) this.disconnect(port);

    const op = this.getSelectedOperation();
    if (op) this.removeOperation(op.id);
  }
}

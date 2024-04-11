import { System } from "./new-model.js";
export class GraphicSystem extends System {
    constructor() {
        super(...arguments);
        this.operationRects = new Map();
        this.operationFlip = new Map();
        this.opWidth = 100;
        this.portGap = 20;
        this.nearThresh = 10;
        this.mouseX = 0;
        this.mouseY = 0;
        this.selectedObject = null;
    }
    addOperation(spec) {
        const id = super.addOperation(spec);
        this.selectedObject = this.getOperation(id);
        return id;
    }
    getOperationRect(id) {
        const rect = this.operationRects.get(id);
        if (rect)
            return rect;
        const op = this.getOperation(id);
        const m = Math.max(op.inputPorts.length, op.outputPorts.length);
        const h = m * this.portGap;
        const newRect = { x: 0, y: 0, w: this.opWidth, h };
        this.operationRects.set(id, newRect);
        return newRect;
    }
    setOperationPosition(id, x, y) {
        const rect = this.operationRects.get(id);
        if (!rect)
            return;
        const newX = x - rect.w / 2;
        const newY = y - rect.h / 2;
        const newRect = { x: newX, y: newY, w: this.opWidth, h: rect.h };
        this.operationRects.set(id, newRect);
    }
    isOperationFlipped(id) {
        const flipped = this.operationFlip.get(id);
        return flipped || false;
    }
    flipOperation(id) {
        const flipped = this.operationFlip.get(id);
        this.operationFlip.set(id, !flipped);
    }
    getPortPosition(port) {
        const op = this.getOperation(port.operationId);
        const r = this.getOperationRect(port.operationId);
        const m = Math.max(op.inputPorts.length, op.outputPorts.length);
        const x = (port.type === "input") !== this.isOperationFlipped(port.operationId)
            ? r.x
            : r.x + r.w;
        const y = port.type === "input"
            ? r.y +
                (this.portGap * (port.index * 2 - op.inputPorts.length + m + 1)) / 2
            : r.y +
                (this.portGap * (port.index * 2 - op.outputPorts.length + m + 1)) / 2;
        return { x, y };
    }
    getPortDirection(port) {
        return (port.type === "input") === this.isOperationFlipped(port.operationId)
            ? 1
            : -1;
    }
    isOperation(operation) {
        if (!operation)
            return false;
        return operation.inputPorts !== undefined;
    }
    isPort(port) {
        if (!port)
            return false;
        return port.operationId !== undefined;
    }
    setMousePosition(x, y) {
        this.mouseX = x;
        this.mouseY = y;
        const op = this.getSelectedOperation();
        if (op)
            this.setOperationPosition(op.id, x, y);
    }
    getNearObject() {
        let minDist = this.nearThresh;
        let nearObject = null;
        for (const operation of this.getOperations()) {
            for (const port of operation.ports) {
                const pos = this.getPortPosition(port);
                const dist = Math.hypot(pos.x - this.mouseX, pos.y - this.mouseY);
                if (dist < minDist) {
                    minDist = dist;
                    nearObject = port;
                }
            }
        }
        if (nearObject)
            return nearObject;
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
    getCursorPosition() {
        const near = this.getNearObject();
        if (!near)
            return [this.mouseX, this.mouseY];
        if (!this.selectedObject && this.isOperation(near)) {
            const rect = this.getOperationRect(near.id);
            return [rect.x + rect.w / 2, rect.y + rect.h / 2];
        }
        if (!this.selectedObject && this.isPort(near)) {
            const pos = this.getPortPosition(near);
            return [pos.x, pos.y];
        }
        if (this.selectedObject &&
            this.isPort(this.selectedObject) &&
            this.isPort(near) &&
            this.isConnectable(this.selectedObject, near)) {
            const pos = this.getPortPosition(near);
            return [pos.x, pos.y];
        }
        return [this.mouseX, this.mouseY];
    }
    getSelectedPort() {
        if (this.selectedObject && this.isPort(this.selectedObject)) {
            return this.selectedObject;
        }
        return null;
    }
    getSelectedOperation() {
        if (this.selectedObject && this.isOperation(this.selectedObject)) {
            return this.selectedObject;
        }
        return null;
    }
    click() {
        const near = this.getNearObject();
        if (!this.selectedObject && !near)
            return;
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
    delete() {
        const port = this.getSelectedPort();
        if (port)
            this.disconnect(port);
        const op = this.getSelectedOperation();
        if (op)
            this.removeOperation(op.id);
        this.selectedObject = null;
    }
}

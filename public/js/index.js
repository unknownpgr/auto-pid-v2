"use strict";
let operations = [];
let edges = [];
let counter = 0;
const addOperation = (type, inputNumber, outputNumber, x, y) => {
    const op = {
        id: counter++,
        type,
        inputNumber,
        outputNumber,
        x,
        y,
        flipped: false,
    };
    operations.push(op);
    return op;
};
const listNodes = (op) => {
    let nodes = [];
    for (let i = 0; i < op.inputNumber; i++) {
        nodes.push({
            operationId: op.id,
            type: "input",
            number: i,
        });
    }
    for (let i = 0; i < op.outputNumber; i++) {
        nodes.push({
            operationId: op.id,
            type: "output",
            number: i,
        });
    }
    return nodes;
};
const hashNode = (node) => {
    return `${node.operationId}-${node.type}-${node.number}`;
};
const isConnectable = (from, to) => {
    if (from.type === to.type)
        return false;
    if (from.type === "input")
        [from, to] = [to, from];
    const toHash = hashNode(to);
    for (const [_, to] of edges) {
        if (hashNode(to) === toHash)
            return false;
    }
    return true;
};
const connect = (from, to) => {
    if (!isConnectable(from, to))
        return;
    if (from.type === "input")
        [from, to] = [to, from];
    edges.push([from, to]);
};
const disconnect = (to) => {
    const toHash = hashNode(to);
    edges = edges.filter(([_, to]) => hashNode(to) !== toHash);
};
const findOperation = (id) => {
    for (const op of operations) {
        if (op.id === id)
            return op;
    }
    throw Error("Operation not found");
};
const isOperation = (obj) => {
    return obj.inputNumber !== undefined;
};
const isNode = (obj) => {
    return obj.operationId !== undefined;
};
// Utilities
let selectedOperation = null;
let selectedNode = null;
let mouseX = 0;
let mouseY = 0;
const OPERATION_TYPES = [
    {
        type: "sum",
        inputNumber: 2,
        outputNumber: 1,
    },
    {
        type: "sub",
        inputNumber: 2,
        outputNumber: 1,
    },
    {
        type: "mul",
        inputNumber: 2,
        outputNumber: 1,
    },
    {
        type: "div",
        inputNumber: 2,
        outputNumber: 1,
    },
    {
        type: "input",
        inputNumber: 0,
        outputNumber: 1,
    },
    {
        type: "output",
        inputNumber: 1,
        outputNumber: 0,
    },
    {
        type: "integral",
        inputNumber: 1,
        outputNumber: 1,
    },
    {
        type: "derivative",
        inputNumber: 1,
        outputNumber: 1,
    },
    {
        type: "irr",
        inputNumber: 1,
        outputNumber: 1,
    },
    {
        type: "time",
        inputNumber: 0,
        outputNumber: 1,
    },
];
const createOperationFromType = (operationType) => {
    if (selectedNode)
        return;
    if (selectedOperation)
        return;
    selectedOperation = addOperation(operationType.type, operationType.inputNumber, operationType.outputNumber, 0, 0);
};
const generateJson = () => {
    const json = {
        operations: operations,
        edges: edges,
    };
    console.log(json);
};
const init = () => {
    const operationsDiv = document.getElementById("operations");
    if (!operationsDiv)
        return;
    for (const op of OPERATION_TYPES) {
        const button = document.createElement("button");
        button.textContent = op.type;
        button.addEventListener("click", () => createOperationFromType(op));
        operationsDiv.appendChild(button);
    }
    const saveButton = document.createElement("button");
    saveButton.textContent = "Save";
    saveButton.addEventListener("click", generateJson);
    operationsDiv.appendChild(saveButton);
};
init();
// Graphics logic layer
const OP_WIDTH = 100;
const NODE_GAP = 20;
const NEAR_THRESHOLD = 10;
const getOperationRect = (op) => {
    const n = Math.max(op.inputNumber, op.outputNumber);
    const height = n * NODE_GAP;
    return {
        x: op.x,
        y: op.y,
        width: OP_WIDTH,
        height,
    };
};
const flipOperation = (op) => {
    op.flipped = !op.flipped;
};
const isNodeFlipped = (node) => {
    return findOperation(node.operationId).flipped;
};
const getNodeY = (node) => {
    const op = findOperation(node.operationId);
    const m = Math.max(op.inputNumber, op.outputNumber);
    const nodes = node.type === "input" ? op.inputNumber : op.outputNumber;
    const y = op.y + (node.number + (m - nodes + 1) / 2) * NODE_GAP;
    return y;
};
const getNodeX = (node) => {
    if (!isNodeFlipped(node)) {
        if (node.type === "input") {
            return findOperation(node.operationId).x;
        }
        else {
            return findOperation(node.operationId).x + OP_WIDTH;
        }
    }
    else {
        if (node.type === "input") {
            return findOperation(node.operationId).x + OP_WIDTH;
        }
        else {
            return findOperation(node.operationId).x;
        }
    }
};
const getNodeDirection = (node) => {
    if (!isNodeFlipped(node)) {
        if (node.type === "input") {
            return -1;
        }
        else {
            return 1;
        }
    }
    else {
        if (node.type === "input") {
            return 1;
        }
        else {
            return -1;
        }
    }
};
const getNodePosition = (node) => {
    const op = findOperation(node.operationId);
    const x = getNodeX(node);
    const y = getNodeY(node);
    return { x, y };
};
const setMousePosition = (x, y) => {
    if (!selectedOperation) {
        mouseX = x;
        mouseY = y;
    }
    else {
        mouseX = Math.floor(x / 10) * 10;
        mouseY = Math.floor(y / 10) * 10;
    }
    if (selectedOperation) {
        const rect = getOperationRect(selectedOperation);
        selectedOperation.x = mouseX - rect.width / 2;
        selectedOperation.y = mouseY - rect.height / 2;
    }
};
const getNearestObject = () => {
    let nearest = null;
    let minDistance = NEAR_THRESHOLD;
    for (const op of operations) {
        for (const node of listNodes(op)) {
            const pos = getNodePosition(node);
            const distance = Math.sqrt(Math.pow((pos.x - mouseX), 2) + Math.pow((pos.y - mouseY), 2));
            if (distance < minDistance) {
                minDistance = distance;
                nearest = node;
            }
        }
    }
    if (nearest)
        return nearest;
    for (const op of operations) {
        const rect = getOperationRect(op);
        const distance = Math.sqrt(Math.pow((rect.x + rect.width / 2 - mouseX), 2) +
            Math.pow((rect.y + rect.height / 2 - mouseY), 2));
        if (distance < minDistance) {
            minDistance = distance;
            nearest = op;
        }
    }
    return nearest;
};
const click = () => {
    // Place selected operation
    if (selectedOperation) {
        selectedOperation = null;
        return;
    }
    const near = getNearestObject();
    // Connect selected node
    if (selectedNode) {
        if (near && isNode(near))
            connect(selectedNode, near);
        selectedNode = null;
        return;
    }
    // Currently, there are no selected objects
    if (!near)
        return;
    // Select operation
    if (isOperation(near)) {
        selectedOperation = near;
        return;
    }
    if (isNode(near)) {
        if (near.type === "input")
            disconnect(near);
        selectedNode = near;
        return;
    }
};
// Implementation layer
const cnv = document.getElementById("cnv");
if (!cnv)
    throw Error("Canvas not found");
const ctx = cnv.getContext("2d");
if (!ctx)
    throw Error("Context not found");
const scale = 2;
const getCubicCurveFunction = (x1, x2, x_1, x_2) => {
    const a = x_1 + x_2 + 2 * x1 - 2 * x2;
    const b = -2 * x_1 - x_2 - 3 * x1 + 3 * x2;
    const c = x_1;
    const d = x1;
    return (t) => a * Math.pow(t, 3) + b * Math.pow(t, 2) + c * t + d;
};
const getEdgeCurve = (x1, y1, x2, y2, dl = 1, dr = 1, k = 50) => {
    const points = [];
    const n = 100;
    const _k = Math.pow(Math.abs(x1 - x2), 1 / 3) * k;
    const fx = getCubicCurveFunction(x1, x2, _k * dl, -_k * dr);
    const fy = getCubicCurveFunction(y1, y2, 0, 0);
    for (let i = 0; i <= n; i++) {
        const t = i / n;
        const x = fx(t);
        const y = fy(t);
        points.push({ x, y });
    }
    return points;
};
const getCursorPosition = (nearest) => {
    if (!nearest)
        return [mouseX, mouseY];
    const selected = selectedOperation || selectedNode;
    if (!selected && isOperation(nearest)) {
        const rect = getOperationRect(nearest);
        return [rect.x + rect.width / 2, rect.y + rect.height / 2];
    }
    if (!selected && isNode(nearest)) {
        const pos = getNodePosition(nearest);
        return [pos.x, pos.y];
    }
    if (selectedNode && isNode(nearest) && isConnectable(selectedNode, nearest)) {
        const pos = getNodePosition(nearest);
        return [pos.x, pos.y];
    }
    return [mouseX, mouseY];
};
const cursor = (x, y, nearest) => {
    const sx = x * scale;
    const sy = y * scale;
    const sl = 5 * scale;
    ctx.beginPath();
    ctx.arc(sx, sy, 4 * scale, 0, Math.PI * 2);
    if (nearest) {
        ctx.moveTo(sx - sl, sy - sl);
        ctx.lineTo(sx + sl, sy + sl);
        ctx.moveTo(sx + sl, sy - sl);
        ctx.lineTo(sx - sl, sy + sl);
    }
    ctx.stroke();
};
const drawRect = ({ x, y, width, height }) => {
    ctx.beginPath();
    ctx.strokeRect(x * scale, y * scale, width * scale, height * scale);
    ctx.stroke();
};
const dot = (x, y) => {
    ctx.beginPath();
    ctx.arc(x * scale, y * scale, 5, 0, Math.PI * 2);
    ctx.fill();
};
const render = () => {
    ctx.clearRect(0, 0, cnv.width, cnv.height);
    ctx.font = `${12 * scale}px Arial`;
    ctx.lineWidth = scale;
    const nearest = getNearestObject();
    let [cursorX, cursorY] = getCursorPosition(nearest);
    cursor(cursorX, cursorY, nearest);
    for (const op of operations) {
        const rect = getOperationRect(op);
        drawRect(rect);
        ctx.fillText(op.type, (rect.x + 5) * scale, (rect.y + 15) * scale);
        for (const node of listNodes(op)) {
            if (selectedNode && !isConnectable(selectedNode, node))
                continue;
            const pos = getNodePosition(node);
            dot(pos.x, pos.y);
        }
    }
    for (const [from, to] of edges) {
        const p1 = getNodePosition(from);
        const p2 = getNodePosition(to);
        const dir1 = getNodeDirection(from);
        const dir2 = getNodeDirection(to);
        const curve = getEdgeCurve(p1.x, p1.y, p2.x, p2.y, dir1, dir2);
        ctx.beginPath();
        ctx.moveTo(curve[0].x * scale, curve[0].y * scale);
        for (const point of curve) {
            ctx.lineTo(point.x * scale, point.y * scale);
        }
        ctx.stroke();
    }
    if (selectedOperation) {
        const rect = getOperationRect(selectedOperation);
        drawRect(rect);
    }
    if (selectedNode) {
        const pos = getNodePosition(selectedNode);
        const dir = getNodeDirection(selectedNode);
        let dir2 = 1;
        if (nearest && isNode(nearest) && isConnectable(selectedNode, nearest)) {
            dir2 = getNodeDirection(nearest);
        }
        else {
            dir2 = Math.sign(pos.x - cursorX);
        }
        const curve = getEdgeCurve(pos.x, pos.y, cursorX, cursorY, dir, dir2);
        ctx.beginPath();
        ctx.moveTo(curve[0].x * scale, curve[0].y * scale);
        for (const point of curve) {
            ctx.lineTo(point.x * scale, point.y * scale);
        }
        ctx.stroke();
    }
};
const loop = () => {
    render();
    requestAnimationFrame(loop);
};
const resizeCanvas = () => {
    cnv.width = window.innerWidth * scale;
    cnv.height = window.innerHeight * scale;
};
cnv.addEventListener("mousemove", (e) => {
    setMousePosition(e.clientX, e.clientY);
});
cnv.addEventListener("click", click);
document.body.addEventListener("keydown", (e) => {
    // Flip when space is pressed
    if (e.key !== " ")
        return;
    if (!selectedOperation)
        return;
    flipOperation(selectedOperation);
});
window.addEventListener("resize", resizeCanvas);
window.addEventListener("load", resizeCanvas);
loop();

// Implementation layer
import { GraphicSystem } from "./graphic.js";
import { OperationSpec } from "./new-model.js";
const specs = [
    //Input
    new OperationSpec({
        name: "Input",
        states: 1,
        inputs: 0,
        outputs: 1,
        initialState: [0],
        transfer: ({ state, input }) => [state[0]],
    }),
    //Output
    new OperationSpec({
        name: "Output",
        states: 0,
        inputs: 1,
        outputs: 0,
        initialState: [],
        transfer: ({ state, input }) => [],
    }),
    // Add
    new OperationSpec({
        name: "Add",
        states: 0,
        inputs: 2,
        outputs: 1,
        initialState: [],
        transfer: ({ state, input }) => [input[0] + input[1]],
    }),
    // Sub
    new OperationSpec({
        name: "Sub",
        states: 0,
        inputs: 2,
        outputs: 1,
        initialState: [],
        transfer: ({ state, input }) => [input[0] - input[1]],
    }),
];
const init = () => {
    const operationsDiv = document.getElementById("operations");
    if (!operationsDiv)
        return;
    for (const spec of specs) {
        const button = document.createElement("button");
        button.textContent = spec.dict.name;
        button.addEventListener("click", () => graphic.addOperation(spec));
        operationsDiv.appendChild(button);
    }
    const saveButton = document.createElement("button");
    saveButton.textContent = "Save";
    // saveButton.addEventListener("click", generateJson);
    operationsDiv.appendChild(saveButton);
};
init();
const graphic = new GraphicSystem();
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
const drawRect = ({ x, y, w, h }) => {
    ctx.beginPath();
    ctx.strokeRect(x * scale, y * scale, w * scale, h * scale);
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
    const nearest = graphic.getNearObject();
    let [cursorX, cursorY] = graphic.getCursorPosition();
    cursor(cursorX, cursorY, nearest);
    const selectedPort = graphic.getSelectedPort();
    for (const op of graphic.getOperations()) {
        const rect = graphic.getOperationRect(op.id);
        drawRect(rect);
        ctx.fillText(op.name, (rect.x + 5) * scale, (rect.y + 15) * scale);
        const ports = [...op.inputPorts, ...op.outputPorts];
        for (const port of ports) {
            if (selectedPort && !graphic.isConnectable(selectedPort, port))
                continue;
            const pos = graphic.getPortPosition(port);
            dot(pos.x, pos.y);
        }
    }
    for (const { from, to } of graphic.getConnections()) {
        const p1 = graphic.getPortPosition(from);
        const p2 = graphic.getPortPosition(to);
        const dir1 = graphic.getPortDirection(from);
        const dir2 = graphic.getPortDirection(to);
        const curve = getEdgeCurve(p1.x, p1.y, p2.x, p2.y, dir1, dir2);
        ctx.beginPath();
        ctx.moveTo(curve[0].x * scale, curve[0].y * scale);
        for (const point of curve) {
            ctx.lineTo(point.x * scale, point.y * scale);
        }
        ctx.stroke();
    }
    const port = graphic.getSelectedPort();
    if (port) {
        const pos = graphic.getPortPosition(port);
        const dir = graphic.getPortDirection(port);
        let dir2 = 1;
        if (nearest &&
            graphic.isPort(nearest) &&
            graphic.isConnectable(port, nearest)) {
            dir2 = graphic.getPortDirection(nearest);
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
    graphic.setMousePosition(e.clientX, e.clientY);
});
cnv.addEventListener("click", () => graphic.click());
document.body.addEventListener("keydown", (e) => {
    // Flip when space is pressed
    if (e.key === " ") {
        const op = graphic.getSelectedOperation();
        if (!op)
            return;
        graphic.flipOperation(op.id);
    }
    if (e.key === "d")
        graphic.delete();
});
window.addEventListener("resize", resizeCanvas);
window.addEventListener("load", resizeCanvas);
loop();
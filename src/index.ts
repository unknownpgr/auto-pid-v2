import { createCanvas } from "canvas";
import fs from "fs/promises";
import { Output, Report, System } from "./core/model";
import { IIR1 } from "./modules/iir";
import { Input } from "./modules/input";
import { Subtract } from "./modules/subtract";
import { Constant } from "./modules/constant";
import { Multiply } from "./modules/multiply";
import { Divide } from "./modules/divide";
import { Integral } from "./modules/integral";

function func(t: number) {
  if (t < 1) return 0;
  else return 1;
}

async function visualize(reports: Report[], filename = "graph.png") {
  const canvas = createCanvas(800, 600);
  const ctx = canvas.getContext("2d");

  // Clear the canvas
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  for (const report of reports) {
    min = Math.min(min, ...report.data);
    max = Math.max(max, ...report.data);
  }
  const margin = 0.1 * (max - min);

  const drawCurve = (values: number[]) => {
    ctx.beginPath();

    const xScale = canvas.width / values.length;
    const yScale = canvas.height / (max - min + 2 * margin);

    for (let i = 0; i < values.length; i++) {
      const x = i * xScale;
      const y = canvas.height - (values[i] - min) * yScale - margin * yScale;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
  };

  const colorTable = [
    "black",
    "red",
    "green",
    "blue",
    "purple",
    "cyan",
    "magenta",
    "yellow",
    "orange",
    "brown",
    "pink",
    "gray",
    "lightblue",
    "lightgreen",
    "lightpink",
    "lightyellow",
    "lightgray",
  ];

  for (let i = 0; i < reports.length; i++) {
    ctx.strokeStyle = colorTable[i % colorTable.length];
    drawCurve(reports[i].data);
    ctx.fillStyle = colorTable[i % colorTable.length];
    ctx.font = "15px Arial";
    ctx.fillText(reports[i].title, 10, 20 * (i + 1));
  }

  // Save the canvas to a file
  const buffer = canvas.toBuffer();
  await fs.writeFile(filename, buffer);
}

async function test() {
  // Define operations
  const input = new Input(func);
  const iir = new IIR1(0.01);
  const sub = new Subtract();
  const inputProbe = new Output("Input");
  const output = new Output("Output");
  const error = new Output("Error");

  // Define the system
  const system = new System();
  system.register(input, iir, sub, inputProbe, output, error);
  system.connect(input.out, iir.in);
  system.connect(input.out, inputProbe.in);
  system.connect(iir.out, output.in);
  system.connect(input.out, sub.in1);
  system.connect(iir.out, sub.in2);
  system.connect(sub.out, error.in);

  // Initialize the system
  system.setDt(0.01);
  system.init();

  // Run the system
  system.run(10);

  // Visualize the result
  const reports: Report[] = system.report();
  await visualize(reports);
}

async function main() {
  const input = new Input(func);

  const torque = new Subtract();
  const inertia = new Constant(1);
  const a = new Divide();
  const w = new Integral();
  const theta = new Integral();
  const mu = new Constant(0.1);
  const friction = new Multiply();
  const output = new Output("Theta");
  const inputProbe = new Output("Input");
  const torqueProbe = new Output("Torque");
  const angularSpeedProbe = new Output("Angular Speed");

  const system = new System();
  system.register(
    input,
    torque,
    inertia,
    a,
    w,
    // theta,
    mu,
    friction,
    // output,
    inputProbe,
    torqueProbe,
    angularSpeedProbe
  );
  system.connect(input.out, torque.in1);
  system.connect(input.out, inputProbe.in);
  system.connect(friction.out, torque.in2);
  system.connect(torque.out, a.in1);
  system.connect(torque.out, torqueProbe.in);
  system.connect(inertia.out, a.in2);
  system.connect(a.out, w.in);
  system.connect(w.out, angularSpeedProbe.in);
  system.connect(w.out, friction.in1);
  system.connect(mu.out, friction.in2);
  // system.connect(theta.out, output.in);

  system.setDt(0.01);
  system.init();
  system.run(100);

  const reports: Report[] = system.report();
  await visualize(reports);
}

main().catch((e) => console.error("\x1b[31m\x1b[1m" + e.message + "\x1b[0m"));

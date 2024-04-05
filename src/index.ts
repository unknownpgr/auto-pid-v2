import { createCanvas } from "canvas";
import fs from "fs/promises";
import { Output, Report, System } from "./core/model";
import { IIR1 } from "./modules/iir";
import { Input } from "./modules/input";

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
    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText(reports[i].title, 10, 30 * (i + 1));
  }

  // Save the canvas to a file
  const buffer = canvas.toBuffer();
  await fs.writeFile(filename, buffer);
}

async function main() {
  const input = new Input(func);
  const iir = new IIR1(0.01);
  const output = new Output("Output");

  const system = new System();
  system.register(input, iir, output);
  system.connect(input.out, iir.in);
  system.connect(iir.out, output.in);
  system.setDt(0.01);
  system.probe(input.out, "Input");
  system.init();
  system.run(10);

  const reports: Report[] = system.report();
  await visualize(reports);
}

main();

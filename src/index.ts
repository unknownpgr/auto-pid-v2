import { Block } from "./core/model";
import { Clipping } from "./modules/clipping";
import { createCanvas } from "canvas";
import fs from "fs/promises";
import { Combine } from "./modules/combine";
import { Delay } from "./modules/delay";
import { IIR1 } from "./modules/iir";

function input(t: number) {
  return Math.sin(t);
}

function test(
  input: (t: number) => number,
  block: Block<number>,
  duration: number = 10,
  dt: number = 0.01
) {
  const inputs = [];
  const outputs = [];
  for (let t = 0; t < duration; t += dt) {
    const value = input(t);
    const output = block.transfer(value);
    inputs.push(value);
    outputs.push(output);
  }
  return { inputs, outputs };
}

async function visualize(
  data: { inputs: number[]; outputs: number[] },
  filename = "graph.png"
) {
  const canvas = createCanvas(800, 600);
  const ctx = canvas.getContext("2d");

  // Clear the canvas
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const min = Math.min(...data.inputs, ...data.outputs);
  const max = Math.max(...data.inputs, ...data.outputs);

  const drawCurve = (values: number[]) => {
    ctx.beginPath();

    const xScale = canvas.width / values.length;
    const yScale = canvas.height / (max - min);

    for (let i = 0; i < values.length; i++) {
      const x = i * xScale;
      const y = canvas.height - (values[i] - min) * yScale;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
  };

  // Draw the input
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  drawCurve(data.inputs);

  // Draw the output
  ctx.strokeStyle = "red";
  drawCurve(data.outputs);

  // Save the canvas to a file
  const buffer = canvas.toBuffer();
  await fs.writeFile(filename, buffer);
}

async function main() {
  const block = new Combine(
    new Clipping(-0.5, 0.5),
    new Delay(0.01, 0.1),
    new IIR1(0.1, 0.9)
  );
  const data = test(input, block);
  await visualize(data);
}

main();

#!/usr/bin/env node
/**
 * Generates public/models/floating-cabinet.glb — a simple placeholder
 * floating cabinet (dark body + warm LED strip underneath) so the AR flow
 * is testable before real models are commissioned.
 *
 * Pure hand-built glTF 2.0 binary; no dependencies.
 * Real-world scale (metres): body 1.6 × 0.4 × 0.45, floating 0.6m up.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const out = join(dirname(fileURLToPath(import.meta.url)), "../public/models/floating-cabinet.glb");

/** Axis-aligned box with per-face normals, centred at (cx, cy, cz). */
function box(sx, sy, sz, cx = 0, cy = 0, cz = 0) {
  const x = sx / 2, y = sy / 2, z = sz / 2;
  // 6 faces × 4 vertices
  const faces = [
    { n: [0, 0, 1],  v: [[-x,-y, z],[ x,-y, z],[ x, y, z],[-x, y, z]] }, // +Z
    { n: [0, 0,-1],  v: [[ x,-y,-z],[-x,-y,-z],[-x, y,-z],[ x, y,-z]] }, // -Z
    { n: [1, 0, 0],  v: [[ x,-y, z],[ x,-y,-z],[ x, y,-z],[ x, y, z]] }, // +X
    { n: [-1,0, 0],  v: [[-x,-y,-z],[-x,-y, z],[-x, y, z],[-x, y,-z]] }, // -X
    { n: [0, 1, 0],  v: [[-x, y, z],[ x, y, z],[ x, y,-z],[-x, y,-z]] }, // +Y
    { n: [0,-1, 0],  v: [[-x,-y,-z],[ x,-y,-z],[ x,-y, z],[-x,-y, z]] }, // -Y
  ];
  const positions = [], normals = [], indices = [];
  faces.forEach((face, f) => {
    face.v.forEach(([vx, vy, vz]) => {
      positions.push(vx + cx, vy + cy, vz + cz);
      normals.push(...face.n);
    });
    const o = f * 4;
    indices.push(o, o + 1, o + 2, o, o + 2, o + 3);
  });
  return { positions: new Float32Array(positions), normals: new Float32Array(normals), indices: new Uint16Array(indices) };
}

function minMax(arr) {
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < arr.length; i += 3) {
    for (let j = 0; j < 3; j++) {
      min[j] = Math.min(min[j], arr[i + j]);
      max[j] = Math.max(max[j], arr[i + j]);
    }
  }
  return { min, max };
}

const body = box(1.6, 0.4, 0.45, 0, 0.6, 0);
const strip = box(1.5, 0.02, 0.4, 0, 0.385, 0);

// Binary buffer: body pos, body norm, strip pos, strip norm, body idx, strip idx
const parts = [body.positions, body.normals, strip.positions, strip.normals, body.indices, strip.indices];
let offset = 0;
const views = parts.map((arr, i) => {
  const byteLength = arr.byteLength;
  const view = {
    buffer: 0,
    byteOffset: offset,
    byteLength,
    target: i < 4 ? 34962 : 34963, // ARRAY_BUFFER : ELEMENT_ARRAY_BUFFER
  };
  offset += byteLength;
  // 4-byte align the next view
  offset = Math.ceil(offset / 4) * 4;
  return view;
});
const binLength = offset;
const bin = Buffer.alloc(binLength);
parts.forEach((arr, i) => Buffer.from(arr.buffer).copy(bin, views[i].byteOffset));

const bodyMM = minMax(body.positions);
const stripMM = minMax(strip.positions);

const gltf = {
  asset: { version: "2.0", generator: "ModernHome placeholder generator" },
  scene: 0,
  scenes: [{ nodes: [0, 1] }],
  nodes: [
    { mesh: 0, name: "CabinetBody" },
    { mesh: 1, name: "LedStrip" },
  ],
  meshes: [
    { primitives: [{ attributes: { POSITION: 0, NORMAL: 1 }, indices: 4, material: 0 }] },
    { primitives: [{ attributes: { POSITION: 2, NORMAL: 3 }, indices: 5, material: 1 }] },
  ],
  materials: [
    {
      name: "Body",
      pbrMetallicRoughness: {
        baseColorFactor: [0.16, 0.16, 0.18, 1],
        metallicFactor: 0.05,
        roughnessFactor: 0.55,
      },
    },
    {
      name: "LedStrip",
      pbrMetallicRoughness: {
        baseColorFactor: [1.0, 0.72, 0.42, 1],
        metallicFactor: 0,
        roughnessFactor: 0.3,
      },
      emissiveFactor: [1.0, 0.72, 0.42],
    },
  ],
  buffers: [{ byteLength: binLength }],
  bufferViews: views,
  accessors: [
    { bufferView: 0, componentType: 5126, count: 24, type: "VEC3", min: bodyMM.min, max: bodyMM.max },
    { bufferView: 1, componentType: 5126, count: 24, type: "VEC3" },
    { bufferView: 2, componentType: 5126, count: 24, type: "VEC3", min: stripMM.min, max: stripMM.max },
    { bufferView: 3, componentType: 5126, count: 24, type: "VEC3" },
    { bufferView: 4, componentType: 5123, count: 36, type: "SCALAR" },
    { bufferView: 5, componentType: 5123, count: 36, type: "SCALAR" },
  ],
};

// GLB container
let json = Buffer.from(JSON.stringify(gltf), "utf8");
const jsonPad = (4 - (json.length % 4)) % 4;
json = Buffer.concat([json, Buffer.alloc(jsonPad, 0x20)]); // pad with spaces
const binPad = (4 - (bin.length % 4)) % 4;
const binPadded = Buffer.concat([bin, Buffer.alloc(binPad)]);

const header = Buffer.alloc(12);
header.writeUInt32LE(0x46546c67, 0); // 'glTF'
header.writeUInt32LE(2, 4);
header.writeUInt32LE(12 + 8 + json.length + 8 + binPadded.length, 8);

const jsonHeader = Buffer.alloc(8);
jsonHeader.writeUInt32LE(json.length, 0);
jsonHeader.writeUInt32LE(0x4e4f534a, 4); // 'JSON'

const binHeader = Buffer.alloc(8);
binHeader.writeUInt32LE(binPadded.length, 0);
binHeader.writeUInt32LE(0x004e4942, 4); // 'BIN\0'

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, Buffer.concat([header, jsonHeader, json, binHeader, binPadded]));
console.log(`Wrote ${out} (${12 + 8 + json.length + 8 + binPadded.length} bytes)`);

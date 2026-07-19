"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getChevronTexture, getMarbleTexture } from "@/lib/three/textures";

const METAL = "#2a2a2e";

/** Low marble-top coffee table with a slim dark-metal frame. */
function CoffeeTable() {
  const marble = useMemo(() => getMarbleTexture(), []);
  const legX = 0.52;
  const legZ = 0.24;
  return (
    <group position={[0.5, 0, 0.05]}>
      {/* Marble top */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.15, 0.06, 0.6]} />
        <meshStandardMaterial
          map={marble}
          color={marble ? "#ffffff" : "#eae4d8"}
          roughness={0.25}
          metalness={0.05}
          envMapIntensity={0.6}
        />
      </mesh>
      {/* Legs */}
      {[
        [-legX, legZ],
        [legX, legZ],
        [-legX, -legZ],
        [legX, -legZ],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.19, z]} castShadow>
          <boxGeometry args={[0.03, 0.38, 0.03]} />
          <meshStandardMaterial color={METAL} metalness={0.85} roughness={0.35} />
        </mesh>
      ))}
      {/* Lower shelf frame rails */}
      {[legZ, -legZ].map((z, i) => (
        <mesh key={i} position={[0, 0.06, z]}>
          <boxGeometry args={[1.06, 0.02, 0.02]} />
          <meshStandardMaterial color={METAL} metalness={0.85} roughness={0.35} />
        </mesh>
      ))}
    </group>
  );
}

/** Brass tray + white-flower vase, the styling touch on the table. */
function TableStyling() {
  const blooms = useMemo(
    () =>
      Array.from({ length: 9 }, () => ({
        x: (Math.random() - 0.5) * 0.14,
        y: 0.14 + Math.random() * 0.06,
        z: (Math.random() - 0.5) * 0.14,
        r: 0.025 + Math.random() * 0.015,
      })),
    []
  );

  return (
    <group position={[0.5, 0.43, 0]}>
      {/* Tray */}
      <mesh position={[0.02, 0.01, 0]} castShadow>
        <boxGeometry args={[0.44, 0.02, 0.26]} />
        <meshStandardMaterial color="#c9a24b" metalness={0.9} roughness={0.3} />
      </mesh>
      {/* A couple of stacked books */}
      <mesh position={[0.14, 0.05, 0.02]} rotation={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[0.2, 0.05, 0.15]} />
        <meshStandardMaterial color="#8a5a3c" roughness={0.7} />
      </mesh>
      {/* Vase */}
      <mesh position={[-0.08, 0.08, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.045, 0.14, 20]} />
        <meshStandardMaterial color="#f2f0ec" roughness={0.35} metalness={0.05} />
      </mesh>
      {/* White flower cluster */}
      <group position={[-0.08, 0, 0]}>
        {blooms.map((b, i) => (
          <mesh key={i} position={[b.x, b.y, b.z]} castShadow>
            <sphereGeometry args={[b.r, 8, 8]} />
            <meshStandardMaterial color="#fbf7f1" roughness={0.6} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** A couple of accent cushions on the sofa — one chevron, one plain. */
function Cushions() {
  const chevron = useMemo(() => getChevronTexture(), []);
  return (
    <group>
      {[-0.55, 0.55].map((dx, i) => (
        <mesh
          key={i}
          position={[0.5 + dx, 0.62, 1.18]}
          rotation={[0.15, dx > 0 ? -0.2 : 0.2, dx > 0 ? -0.08 : 0.08]}
          castShadow
        >
          <boxGeometry args={[0.42, 0.42, 0.14]} />
          {i === 0 ? (
            <meshStandardMaterial map={chevron} color={chevron ? "#ffffff" : "#b8a58a"} roughness={0.9} />
          ) : (
            <meshStandardMaterial color="#9c8f7d" roughness={0.9} />
          )}
        </mesh>
      ))}
    </group>
  );
}

/** A single taupe armchair, front-right, angled toward the coffee table. */
function Armchair() {
  return (
    <group position={[2.7, 0, 1.5]} rotation={[0, -0.6, 0]}>
      {/* Seat base */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[0.85, 0.32, 0.85]} />
        <meshStandardMaterial color="#b0a48f" roughness={0.9} />
      </mesh>
      {/* Seat cushion */}
      <mesh position={[0, 0.5, 0.02]} castShadow>
        <boxGeometry args={[0.78, 0.14, 0.78]} />
        <meshStandardMaterial color="#bcb097" roughness={0.9} />
      </mesh>
      {/* Backrest */}
      <mesh position={[0, 0.72, -0.36]} castShadow>
        <boxGeometry args={[0.85, 0.6, 0.16]} />
        <meshStandardMaterial color="#b0a48f" roughness={0.9} />
      </mesh>
      {/* Arms */}
      {[-0.42, 0.42].map((x) => (
        <mesh key={x} position={[x, 0.5, 0]} castShadow>
          <boxGeometry args={[0.14, 0.34, 0.85]} />
          <meshStandardMaterial color="#a99d88" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

/** Small objects styling the floating cabinet + showcase shelves. */
function ShelfObjects() {
  return (
    <group>
      {/* Floating cabinet top: book stack + object */}
      <group position={[1.15, 0.97, -2.7]}>
        <mesh position={[0, 0.03, 0]} castShadow>
          <boxGeometry args={[0.22, 0.05, 0.16]} />
          <meshStandardMaterial color="#3f4a44" roughness={0.7} />
        </mesh>
        <mesh position={[0.01, 0.08, 0.01]} rotation={[0, 0.3, 0]} castShadow>
          <boxGeometry args={[0.2, 0.04, 0.15]} />
          <meshStandardMaterial color="#c9a24b" metalness={0.6} roughness={0.4} />
        </mesh>
      </group>
      {/* A slim decorative vase further along the cabinet */}
      <mesh position={[0.1, 1.02, -2.7]} castShadow>
        <cylinderGeometry args={[0.04, 0.05, 0.22, 16]} />
        <meshStandardMaterial color="#2f2b28" roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Showcase shelves: little books + a bowl */}
      <group position={[-3.55, 0, -0.5]}>
        <mesh position={[0, 0.7, 0.18]} rotation={[0, 0, 0.02]} castShadow>
          <boxGeometry args={[0.16, 0.14, 0.04]} />
          <meshStandardMaterial color="#7a4a34" roughness={0.7} />
        </mesh>
        <mesh position={[0.02, 0.7, 0.05]} castShadow>
          <boxGeometry args={[0.16, 0.16, 0.04]} />
          <meshStandardMaterial color="#39524b" roughness={0.7} />
        </mesh>
        <mesh position={[0, 1.28, 0]} castShadow>
          <sphereGeometry args={[0.08, 16, 12]} />
          <meshStandardMaterial color="#c9a24b" metalness={0.7} roughness={0.35} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Slow-drifting dust motes catching the warm light — pure atmosphere.
 * ~260 additive points that rise and gently wrap; cheap and only render
 * while a canvas is active.
 */
function DustMotes() {
  const COUNT = 260;
  const ref = useRef<THREE.Points>(null);

  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const speeds = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = -2.5 + Math.random() * 5.5; // x
      positions[i * 3 + 1] = 0.2 + Math.random() * 3.0; // y
      positions[i * 3 + 2] = -2.5 + Math.random() * 4.0; // z
      speeds[i] = 0.02 + Math.random() * 0.05;
    }
    return { positions, speeds };
  }, []);

  useFrame((_, delta) => {
    const pts = ref.current;
    if (!pts) return;
    const arr = pts.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < COUNT; i++) {
      arr[i * 3 + 1] += speeds[i] * delta; // drift up
      if (arr[i * 3 + 1] > 3.3) arr[i * 3 + 1] = 0.2; // wrap
    }
    pts.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={COUNT}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.018}
        color="#ffe6b8"
        transparent
        opacity={0.5}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export function Decor() {
  return (
    <group>
      <CoffeeTable />
      <TableStyling />
      <Cushions />
      <Armchair />
      <ShelfObjects />
      <DustMotes />
    </group>
  );
}

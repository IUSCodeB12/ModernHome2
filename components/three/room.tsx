"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshReflectorMaterial } from "@react-three/drei";
import * as THREE from "three";
import { Hotspot, type HotspotConfig } from "@/components/three/hotspot";
import { getMarbleTexture, getWoodTexture } from "@/lib/three/textures";
import { Decor } from "@/components/three/decor";

/** Hotspots: camera dolly targets + hit boxes for each installable item. */
export const HOTSPOTS: HotspotConfig[] = [
  {
    id: "tv",
    label: "TV Wall Mounting",
    slug: "tv-wall-mounting",
    camera: [0.6, 1.7, 0.4],
    target: [0.6, 1.6, -2.9],
    center: [0.6, 1.62, -2.9],
    size: [1.7, 1.05, 0.3],
  },
  {
    id: "cabinet",
    label: "TV / Floating Cabinet",
    slug: "tv-floating-cabinet",
    camera: [0.6, 1.1, 0.6],
    target: [0.6, 0.72, -2.75],
    center: [0.6, 0.72, -2.72],
    size: [2.0, 0.6, 0.6],
  },
  {
    id: "showcase",
    label: "Showcase Cabinet",
    slug: "showcase-cabinet",
    camera: [-1.4, 1.5, 1.3],
    target: [-3.7, 1.25, -0.5],
    center: [-3.68, 1.25, -0.5],
    size: [0.6, 2.3, 1.25],
  },
  {
    id: "led",
    label: "LED Strip Lighting",
    slug: "led-strip-lighting",
    camera: [0, 2.2, 0.8],
    target: [0, 3.0, -2.9],
    center: [0, 3.02, -2.86],
    size: [7.8, 0.3, 0.3],
  },
  {
    id: "heater",
    label: "Room Heater Installation",
    slug: "room-heater-installation",
    camera: [-1.6, 1.0, 1.5],
    target: [-3.9, 0.75, 1.4],
    center: [-3.88, 0.75, 1.4],
    size: [0.25, 0.65, 1.05],
  },
];

const WALL = "#efe9e0"; // warm off-white
const FLOOR = "#d8cdba"; // warm marble tile
const CABINET = "#22201d"; // dark walnut lacquer
const ACCENT = "#8a7a63";
const BRASS = "#c9a24b";
const WOOD = "#8a6a45";

function LedCove() {
  const stripRef = useRef<THREE.MeshStandardMaterial>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const color = useRef(new THREE.Color());

  // Subtle idle animation: a slow warm-amber breathe (luxe, not RGB).
  useFrame(({ clock }) => {
    const hue = 0.09 + Math.sin(clock.elapsedTime * 0.15) * 0.03; // 0.06–0.12
    color.current.setHSL(hue, 0.5, 0.62);
    if (stripRef.current) {
      stripRef.current.emissive.copy(color.current);
      stripRef.current.color.copy(color.current);
    }
    if (lightRef.current) lightRef.current.color.copy(color.current);
  });

  return (
    <group>
      <mesh position={[0, 3.02, -2.86]}>
        <boxGeometry args={[7.6, 0.06, 0.1]} />
        <meshStandardMaterial
          ref={stripRef}
          emissiveIntensity={2.2}
          toneMapped={false}
        />
      </mesh>
      {/* Cove pelmet */}
      <mesh position={[0, 3.1, -2.78]} castShadow>
        <boxGeometry args={[7.7, 0.1, 0.3]} />
        <meshStandardMaterial color={WALL} />
      </mesh>
      <pointLight
        ref={lightRef}
        position={[0, 2.9, -2.6]}
        intensity={1.2}
        distance={5}
        decay={2}
      />
    </group>
  );
}

/** Marble feature wall behind the TV, with brass reveals + a backlit wood-slat panel. */
function FeatureWall() {
  const marble = useMemo(() => getMarbleTexture(), []);
  const wood = useMemo(() => {
    const t = getWoodTexture();
    if (t) t.repeat.set(1, 2);
    return t;
  }, []);

  // Vertical wood slats on the right of the feature wall.
  const slatXs = useMemo(
    () => Array.from({ length: 8 }, (_, i) => 1.7 + i * 0.11),
    []
  );

  return (
    <group>
      {/* Marble panel (slightly proud of the base wall) */}
      <mesh position={[0.1, 1.62, -2.94]} receiveShadow>
        <boxGeometry args={[3.8, 3.15, 0.06]} />
        <meshStandardMaterial
          map={marble}
          color={marble ? "#ffffff" : "#f1ede6"}
          roughness={0.22}
          metalness={0.05}
          envMapIntensity={0.7}
        />
      </mesh>

      {/* Brass vertical reveals inset in the marble */}
      {[-1.5, -0.75, 1.55].map((x) => (
        <mesh key={x} position={[x, 1.62, -2.9]}>
          <boxGeometry args={[0.04, 3.05, 0.02]} />
          <meshStandardMaterial
            color={BRASS}
            metalness={0.9}
            roughness={0.28}
            emissive={BRASS}
            emissiveIntensity={0.12}
          />
        </mesh>
      ))}

      {/* Fluted marble accent — fine vertical grooves on the left panel */}
      {Array.from({ length: 11 }, (_, i) => -1.78 + i * 0.075).map((x) => (
        <mesh key={x} position={[x, 1.62, -2.9]}>
          <boxGeometry args={[0.03, 3.0, 0.03]} />
          <meshStandardMaterial
            map={marble}
            color={marble ? "#ffffff" : "#f1ede6"}
            roughness={0.2}
            metalness={0.04}
          />
        </mesh>
      ))}

      {/* Backlit wood-slat panel */}
      <mesh position={[2.05, 1.55, -2.97]} receiveShadow>
        <boxGeometry args={[1.05, 2.9, 0.04]} />
        <meshStandardMaterial map={wood} color={wood ? "#ffffff" : WOOD} roughness={0.6} />
      </mesh>
      {slatXs.map((x) => (
        <mesh key={x} position={[x, 1.55, -2.88]} castShadow>
          <boxGeometry args={[0.05, 2.85, 0.05]} />
          <meshStandardMaterial map={wood} color={wood ? "#ffffff" : WOOD} roughness={0.55} />
        </mesh>
      ))}
      {/* Warm wash behind the slats */}
      <pointLight position={[2.05, 2.4, -2.6]} intensity={0.9} color="#ffcf8f" distance={3} decay={2} />
    </group>
  );
}

/** Floor-to-ceiling sheer curtains on the right, backlit like a window. */
function Curtains() {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(1.5, 3.15, 48, 1);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      // Overlapping folds: a fast ripple riding a slower wave.
      const z = Math.sin(x * 9) * 0.05 + Math.sin(x * 3.3) * 0.03;
      pos.setZ(i, z);
    }
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <group position={[3.35, 1.6, -2.82]}>
      {/* Cool daylight window glow behind the sheers */}
      <mesh position={[0, 0, -0.12]}>
        <planeGeometry args={[1.5, 3.15]} />
        <meshStandardMaterial color="#dfe6f0" emissive="#eef3fb" emissiveIntensity={0.7} />
      </mesh>
      <mesh geometry={geo} castShadow>
        <meshStandardMaterial
          color="#eae2d4"
          roughness={0.95}
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
      <pointLight position={[0, 0.6, 0.4]} intensity={0.5} color="#f3eee4" distance={3} decay={2} />
    </group>
  );
}

/** Slow-turning 3-blade ceiling fan in the tray centre. */
function CeilingFan() {
  const blades = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (blades.current) blades.current.rotation.y += delta * 0.6;
  });
  return (
    <group position={[0, 3.12, -0.4]}>
      {/* Downrod */}
      <mesh position={[0, 0.24, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.36, 12]} />
        <meshStandardMaterial color="#c8ccce" metalness={0.85} roughness={0.3} />
      </mesh>
      {/* Ceiling mount canopy */}
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.07, 0.05, 0.05, 16]} />
        <meshStandardMaterial color="#d7dadb" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Everything that spins */}
      <group ref={blades}>
        {/* Motor hub */}
        <mesh castShadow>
          <cylinderGeometry args={[0.11, 0.13, 0.08, 24]} />
          <meshStandardMaterial color="#d7dadb" metalness={0.8} roughness={0.3} />
        </mesh>

        {/* Blades: group rotated about Y, blade offset outward → true radial symmetry */}
        {[0, 1, 2].map((i) => (
          <group key={i} rotation={[0, (i * Math.PI * 2) / 3, 0]}>
            {/* Arm from hub to blade */}
            <mesh position={[0.18, 0, 0]} castShadow>
              <boxGeometry args={[0.18, 0.02, 0.04]} />
              <meshStandardMaterial color="#c3c7c9" metalness={0.7} roughness={0.35} />
            </mesh>
            {/* Pitched blade */}
            <mesh position={[0.56, -0.01, 0]} rotation={[0.14, 0, 0]} castShadow>
              <boxGeometry args={[0.62, 0.012, 0.15]} />
              <meshStandardMaterial color="#f3f1ec" roughness={0.5} metalness={0.05} />
            </mesh>
          </group>
        ))}

        {/* Warm light kit under the motor */}
        <mesh position={[0, -0.08, 0]}>
          <sphereGeometry args={[0.055, 16, 12]} />
          <meshStandardMaterial
            color="#fff2d6"
            emissive="#ffdfa0"
            emissiveIntensity={1.5}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
}

/** Dark timber entry door on the left wall. */
function EntryDoor() {
  return (
    <group position={[-3.94, 0, 1.5]} rotation={[0, Math.PI / 2, 0]}>
      {/* Frame */}
      <mesh position={[0, 1.05, 0]}>
        <boxGeometry args={[1.02, 2.15, 0.06]} />
        <meshStandardMaterial color="#4a3524" roughness={0.5} />
      </mesh>
      {/* Door leaf */}
      <mesh position={[0, 1.03, 0.03]} castShadow>
        <boxGeometry args={[0.9, 2.02, 0.04]} />
        <meshStandardMaterial color="#3a2917" roughness={0.45} metalness={0.05} />
      </mesh>
      {/* Handle */}
      <mesh position={[0.34, 1.0, 0.06]}>
        <cylinderGeometry args={[0.015, 0.015, 0.28, 10]} />
        <meshStandardMaterial color="#1c1c1e" metalness={0.7} roughness={0.35} />
      </mesh>
    </group>
  );
}

/** Dropped ceiling with a recessed tray, warm cove perimeter and downlights. */
function Ceiling() {
  const downlights = useMemo(
    () => [
      [-1.6, -1.6],
      [0.4, -1.6],
      [-1.2, 0.6],
      [1.2, 0.4],
    ] as const,
    []
  );

  return (
    <group>
      {/* Main ceiling */}
      <mesh position={[0, 3.3, -0.1]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 6.4]} />
        <meshStandardMaterial color={WALL} roughness={0.95} side={THREE.DoubleSide} />
      </mesh>
      {/* Recessed inner panel (sits higher) */}
      <mesh position={[0, 3.46, -0.4]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5, 3.6]} />
        <meshStandardMaterial color="#f4efe7" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      {/* Warm cove around the reveal */}
      {[
        { p: [0, 3.36, -2.2], s: [5, 0.06, 0.06] },
        { p: [0, 3.36, 1.4], s: [5, 0.06, 0.06] },
        { p: [-2.5, 3.36, -0.4], s: [0.06, 0.06, 3.6] },
        { p: [2.5, 3.36, -0.4], s: [0.06, 0.06, 3.6] },
      ].map((seg, i) => (
        <mesh key={i} position={seg.p as unknown as [number, number, number]}>
          <boxGeometry args={seg.s as unknown as [number, number, number]} />
          <meshStandardMaterial
            color="#ffd9a0"
            emissive="#ffcf8f"
            emissiveIntensity={1.8}
            toneMapped={false}
          />
        </mesh>
      ))}
      <pointLight position={[0, 3.1, -0.4]} intensity={0.7} color="#ffe6c2" distance={6} decay={2} />

      {/* Recessed downlights (emissive discs) */}
      {downlights.map(([x, z], i) => (
        <mesh key={i} position={[x, 3.28, z]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.09, 16]} />
          <meshStandardMaterial
            color="#fff4e0"
            emissive="#ffe9c6"
            emissiveIntensity={2.2}
            toneMapped={false}
          />
        </mesh>
      ))}

      <CeilingFan />
    </group>
  );
}

function TvAndCabinet() {
  const wood = useMemo(() => {
    const t = getWoodTexture();
    if (t) t.repeat.set(3, 1);
    return t;
  }, []);
  return (
    <group>
      {/* TV panel */}
      <mesh position={[0.6, 1.65, -2.9]} castShadow>
        <boxGeometry args={[1.5, 0.88, 0.05]} />
        <meshStandardMaterial color="#0b0b0d" roughness={0.25} metalness={0.3} />
      </mesh>
      {/* Screen glow */}
      <mesh position={[0.6, 1.65, -2.87]}>
        <planeGeometry args={[1.42, 0.8]} />
        <meshStandardMaterial
          color="#0e1a24"
          emissive="#16303f"
          emissiveIntensity={0.9}
          roughness={0.2}
        />
      </mesh>

      {/* Long floating console — dark glossy drawers */}
      <mesh position={[0.55, 0.72, -2.72]} castShadow>
        <boxGeometry args={[2.6, 0.34, 0.44]} />
        <meshStandardMaterial color={CABINET} roughness={0.22} metalness={0.2} />
      </mesh>
      {/* Light-wood top slab */}
      <mesh position={[0.55, 0.91, -2.71]} castShadow>
        <boxGeometry args={[2.68, 0.06, 0.5]} />
        <meshStandardMaterial map={wood} color={wood ? "#ffffff" : WOOD} roughness={0.5} />
      </mesh>
      {/* Drawer front sheen */}
      <mesh position={[0.55, 0.7, -2.49]}>
        <planeGeometry args={[2.56, 0.3]} />
        <meshStandardMaterial color="#16140f" roughness={0.18} metalness={0.35} />
      </mesh>
      {/* Brass drawer reveals */}
      {[-0.75, 0.0, 0.75, 1.5].map((x) => (
        <mesh key={x} position={[x + 0.55 - 0.375, 0.7, -2.485]}>
          <boxGeometry args={[0.012, 0.28, 0.01]} />
          <meshStandardMaterial color={BRASS} metalness={0.9} roughness={0.3} />
        </mesh>
      ))}
      {/* LED underglow strip */}
      <mesh position={[0.55, 0.535, -2.72]}>
        <boxGeometry args={[2.5, 0.015, 0.42]} />
        <meshStandardMaterial
          emissive="#ffb163"
          emissiveIntensity={2.4}
          color="#ffb163"
          toneMapped={false}
        />
      </mesh>
      <pointLight
        position={[0.55, 0.42, -2.55]}
        intensity={1.9}
        color="#ffb163"
        distance={2.6}
        decay={2}
      />
    </group>
  );
}

function ShowcaseCabinet() {
  return (
    <group position={[-3.68, 0, -0.5]}>
      {/* Body */}
      <mesh position={[0, 1.15, 0]} castShadow>
        <boxGeometry args={[0.42, 2.3, 1.15]} />
        <meshStandardMaterial color={ACCENT} roughness={0.6} />
      </mesh>
      {/* Interior cavity */}
      <mesh position={[0.06, 1.2, 0]}>
        <boxGeometry args={[0.34, 2.0, 1.0]} />
        <meshStandardMaterial color="#3d3628" roughness={0.8} />
      </mesh>
      {/* Glass front */}
      <mesh position={[0.22, 1.2, 0]}>
        <planeGeometry args={[1.0, 2.0]} />
        <meshStandardMaterial
          color="#bfe3ec"
          transparent
          opacity={0.18}
          roughness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Shelves */}
      {[0.65, 1.2, 1.75].map((y) => (
        <mesh key={y} position={[0.06, y, 0]}>
          <boxGeometry args={[0.34, 0.02, 1.0]} />
          <meshStandardMaterial
            color="#d8ecf2"
            transparent
            opacity={0.5}
            roughness={0.15}
          />
        </mesh>
      ))}
      {/* Internal display light */}
      <pointLight position={[0.1, 2.05, 0]} intensity={0.7} color="#ffe7c4" distance={1.6} decay={2} />
    </group>
  );
}

function PanelHeater() {
  return (
    <group position={[-3.94, 0.75, 1.4]}>
      <mesh castShadow>
        <boxGeometry args={[0.07, 0.55, 0.95]} />
        <meshStandardMaterial color="#f4f2ee" roughness={0.4} />
      </mesh>
      {/* Warm glow core */}
      <mesh position={[0.045, 0, 0]}>
        <planeGeometry args={[0.85, 0.4]} />
        <meshStandardMaterial
          color="#f4f2ee"
          emissive="#ff7847"
          emissiveIntensity={0.35}
          roughness={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

function Rug() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.4, 0.005, -0.6]} receiveShadow>
      <planeGeometry args={[3.4, 2.2]} />
      <meshStandardMaterial color="#a89880" roughness={0.9} />
    </mesh>
  );
}

function Sofa() {
  return (
    <group position={[0.5, 0, 0.9]}>
      <mesh position={[0, 0.28, 0]} castShadow>
        <boxGeometry args={[2.2, 0.5, 0.95]} />
        <meshStandardMaterial color="#6b7a72" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.68, 0.42]} castShadow>
        <boxGeometry args={[2.2, 0.55, 0.22]} />
        <meshStandardMaterial color="#5f6e66" roughness={0.85} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 1.08, 0.5, 0]} castShadow>
          <boxGeometry args={[0.22, 0.42, 0.95]} />
          <meshStandardMaterial color="#5f6e66" roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * The room's visual geometry with no interactivity — shared by the
 * interactive hero and the scroll-driven tour so they look identical.
 */
function ReflectiveFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[8, 6.4]} />
      <MeshReflectorMaterial
        resolution={256}
        mixBlur={1}
        mixStrength={2.2}
        blur={[320, 90]}
        roughness={0.85}
        depthScale={1}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.2}
        color={FLOOR}
        metalness={0.35}
      />
    </mesh>
  );
}

/**
 * The room's visual geometry with no interactivity — shared by the
 * interactive hero and the scroll-driven tour so they look identical.
 * `reflections` enables the polished mirror floor (used in the hero;
 * the tour stays matte so continuous scroll rendering stays cheap).
 */
export function RoomGeometry({ reflections = false }: { reflections?: boolean }) {
  return (
    <group>
      {/* Floor */}
      {reflections ? (
        <ReflectiveFloor />
      ) : (
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[8, 6.4]} />
          <meshStandardMaterial color={FLOOR} roughness={0.5} metalness={0.15} />
        </mesh>
      )}
      {/* Back wall */}
      <mesh position={[0, 1.6, -3]} receiveShadow>
        <planeGeometry args={[8, 3.2]} />
        <meshStandardMaterial color={WALL} roughness={0.95} />
      </mesh>
      {/* Left wall */}
      <mesh position={[-4, 1.6, 0.2]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[6.4, 3.2]} />
        <meshStandardMaterial color={WALL} roughness={0.95} />
      </mesh>
      {/* Skirting */}
      <mesh position={[0, 0.06, -2.98]}>
        <boxGeometry args={[8, 0.12, 0.02]} />
        <meshStandardMaterial color="#ffffff" roughness={0.6} />
      </mesh>

      <Ceiling />
      <EntryDoor />
      <Curtains />
      <Rug />
      <Sofa />
      <FeatureWall />
      <TvAndCabinet />
      <ShowcaseCabinet />
      <LedCove />
      <PanelHeater />
      <Decor />
    </group>
  );
}

export function Room({ onSelect }: { onSelect: (config: HotspotConfig) => void }) {
  const byId = Object.fromEntries(HOTSPOTS.map((h) => [h.id, h]));

  return (
    <group>
      <RoomGeometry reflections />

      {/* Invisible hit boxes + hover labels for each installable item. */}
      {HOTSPOTS.map((config) => (
        <Hotspot key={config.id} config={byId[config.id]} onSelect={onSelect}>
          <group />
        </Hotspot>
      ))}
    </group>
  );
}

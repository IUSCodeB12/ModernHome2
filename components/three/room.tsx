"use client";

import { Hotspot, type HotspotConfig } from "@/components/three/hotspot";
import { Decor } from "@/components/three/decor";
import {
  Ceiling,
  Curtains,
  EntryDoor,
  FeatureWall,
  FLOOR,
  LedCove,
  PanelHeater,
  ReflectiveFloor,
  Rug,
  ShowcaseCabinet,
  Sofa,
  TvAndCabinet,
  WALL,
} from "@/components/three/room-parts";

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

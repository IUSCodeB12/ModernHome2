"use client";

import { useState } from "react";
import { Html } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";

export type HotspotConfig = {
  id: string;
  label: string;
  slug: string;
  /** Camera position for the dolly-in. */
  camera: [number, number, number];
  /** Look-at target for the dolly-in. */
  target: [number, number, number];
  /** Centre of the glow/label box. */
  center: [number, number, number];
  /** Size of the invisible hit / glow box. */
  size: [number, number, number];
};

/**
 * Wraps an installable item: hover = glow + floating label,
 * click/tap = notify parent (camera dolly + navigation happen outside).
 */
export function Hotspot({
  config,
  onSelect,
  children,
}: {
  config: HotspotConfig;
  onSelect: (config: HotspotConfig) => void;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);

  function handleOver(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = "pointer";
  }

  function handleOut() {
    setHovered(false);
    document.body.style.cursor = "auto";
  }

  function handleClick(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation();
    handleOut();
    onSelect(config);
  }

  return (
    <group>
      {children}

      {/* Invisible hit box + hover glow */}
      <mesh
        position={config.center}
        onPointerOver={handleOver}
        onPointerOut={handleOut}
        onClick={handleClick}
      >
        <boxGeometry args={config.size} />
        <meshBasicMaterial
          color="#7dd3fc"
          transparent
          opacity={hovered ? 0.18 : 0}
          depthWrite={false}
        />
      </mesh>

      {hovered && (
        <Html
          position={[
            config.center[0],
            config.center[1] + config.size[1] / 2 + 0.18,
            config.center[2],
          ]}
          center
          distanceFactor={6}
          style={{ pointerEvents: "none" }}
        >
          <div className="whitespace-nowrap rounded-full bg-neutral-900/90 px-3 py-1 text-xs font-medium text-white shadow-lg">
            {config.label}
          </div>
        </Html>
      )}
    </group>
  );
}

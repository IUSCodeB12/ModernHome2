"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { CameraControls, Environment, Lightformer } from "@react-three/drei";
import { Room } from "@/components/three/room";
import type { HotspotConfig } from "@/components/three/hotspot";

const INITIAL = {
  camera: [3.4, 1.9, 4.6] as const,
  target: [-0.4, 1.15, -1.0] as const,
};

function SceneContents({ onNavigate }: { onNavigate: (slug: string) => void }) {
  const controlsRef = useRef<CameraControls>(null);
  const navigatingRef = useRef(false);
  const idleRef = useRef(true);
  const baseAzimuthRef = useRef(0);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.setLookAt(...INITIAL.camera, ...INITIAL.target, false);
    // Keep the camera inside sensible bounds.
    controls.minDistance = 2;
    controls.maxDistance = 8;
    controls.minPolarAngle = Math.PI * 0.18;
    controls.maxPolarAngle = Math.PI * 0.52;
    controls.minAzimuthAngle = -Math.PI * 0.05;
    controls.maxAzimuthAngle = Math.PI * 0.42;
    baseAzimuthRef.current = controls.azimuthAngle;

    // The moment the user grabs the camera, hand over control for good.
    const stopIdle = () => {
      idleRef.current = false;
    };
    controls.addEventListener("controlstart", stopIdle);
    return () => controls.removeEventListener("controlstart", stopIdle);
  }, []);

  // Gentle auto-orbit while untouched, so the room feels alive on load.
  useFrame(({ clock }) => {
    const controls = controlsRef.current;
    if (!controls || !idleRef.current || navigatingRef.current) return;
    controls.azimuthAngle =
      baseAzimuthRef.current + Math.sin(clock.elapsedTime * 0.1) * 0.045;
  });

  async function handleSelect(config: HotspotConfig) {
    const controls = controlsRef.current;
    if (!controls || navigatingRef.current) return;
    navigatingRef.current = true;
    idleRef.current = false; // hotspot dolly owns the camera from here
    console.info("[hero] hotspot selected:", config.slug);
    try {
      // Smooth dolly to the item, then hand over to the service page.
      // Race with a timeout — the transition promise can stall if the
      // user grabs the camera mid-flight, and navigation must still win.
      await Promise.race([
        controls.setLookAt(...config.camera, ...config.target, true),
        new Promise((resolve) => setTimeout(resolve, 1400)),
      ]);
      onNavigate(config.slug);
    } finally {
      navigatingRef.current = false;
    }
  }

  return (
    <>
      <CameraControls ref={controlsRef} smoothTime={0.45} />

      {/* Key light through the "window" (off to the right) */}
      <directionalLight
        position={[5, 4.2, 2.5]}
        intensity={1.75}
        color="#fff3e0"
        castShadow
        shadow-radius={5}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-2}
      />
      <ambientLight intensity={0.62} color="#fff3e2" />

      {/* Procedural environment lighting — no network fetch. */}
      <Environment resolution={64}>
        <Lightformer intensity={2.1} position={[6, 3, 4]} scale={[4, 3, 1]} color="#fff4e6" />
        <Lightformer intensity={1.1} position={[-4, 4, -2]} scale={[3, 2, 1]} color="#e6ecf6" />
        <Lightformer intensity={0.5} position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[6, 6, 1]} color="#ffffff" />
      </Environment>

      <Room onSelect={handleSelect} />
    </>
  );
}

export default function HeroScene({ onNavigate }: { onNavigate: (slug: string) => void }) {
  // Pause rendering entirely when the tab is hidden.
  const [frameloop, setFrameloop] = useState<"always" | "never">("always");

  useEffect(() => {
    const onVisibility = () =>
      setFrameloop(document.hidden ? "never" : "always");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return (
    <Canvas
      shadows="percentage"
      frameloop={frameloop}
      dpr={[1, 1.5]}
      camera={{ fov: 42, near: 0.1, far: 40 }}
      className="!touch-pan-y"
      aria-label="Interactive 3D lounge room — tap an item to explore that service"
    >
      <color attach="background" args={["#171513"]} />
      <fog attach="fog" args={["#171513", 12, 22]} />
      <SceneContents onNavigate={onNavigate} />
    </Canvas>
  );
}

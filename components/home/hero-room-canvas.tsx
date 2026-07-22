"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { RoomGeometry } from "@/components/three/room";

const TARGET: [number, number, number] = [-0.2, 1.2, -1.2];

/** Decorative slow auto-orbit around the styled room — no interaction. */
function OrbitRig() {
  const cam = useRef<THREE.PerspectiveCamera>(null);
  useFrame(({ clock }) => {
    if (!cam.current) return;
    const t = clock.elapsedTime;
    const azimuth = 0.42 + Math.sin(t * 0.07) * 0.14;
    const radius = 5.4;
    cam.current.position.set(
      Math.sin(azimuth) * radius,
      1.85 + Math.sin(t * 0.05) * 0.08,
      Math.cos(azimuth) * radius
    );
    cam.current.lookAt(TARGET[0], TARGET[1], TARGET[2]);
  });
  return (
    <PerspectiveCamera
      ref={cam}
      makeDefault
      fov={40}
      near={0.1}
      far={40}
      position={[3.4, 1.9, 4.6]}
    />
  );
}

export default function HeroRoomCanvas() {
  // Pause rendering when the tab is hidden.
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
      className="!touch-pan-y"
      aria-label="A styled lounge room showcasing our installs"
    >
      <color attach="background" args={["#1a1714"]} />
      <fog attach="fog" args={["#1a1714", 11, 20]} />
      <OrbitRig />

      <directionalLight
        position={[5, 4.2, 2.5]}
        intensity={1.7}
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

      <Environment resolution={64}>
        <Lightformer intensity={2.1} position={[6, 3, 4]} scale={[4, 3, 1]} color="#fff4e6" />
        <Lightformer intensity={1.1} position={[-4, 4, -2]} scale={[3, 2, 1]} color="#e6ecf6" />
        <Lightformer intensity={0.5} position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[6, 6, 1]} color="#ffffff" />
      </Environment>

      <RoomGeometry reflections />
    </Canvas>
  );
}

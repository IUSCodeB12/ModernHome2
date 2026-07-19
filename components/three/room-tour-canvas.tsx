"use client";

import { useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { RoomGeometry } from "@/components/three/room";
import { TOUR_STOPS } from "@/lib/three/tour";

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

/**
 * Drives the camera along the tour keyframes from a scroll-progress ref
 * (0..1). Each frame it computes the target pose for the current scroll
 * position, then damps the real camera toward it so coarse scroll/wheel
 * steps still read as a smooth glide.
 */
function TourCamera({ progressRef }: { progressRef: RefObject<number> }) {
  const cameras = useMemo(
    () => TOUR_STOPS.map((s) => new THREE.Vector3(...s.camera)),
    []
  );
  const targets = useMemo(
    () => TOUR_STOPS.map((s) => new THREE.Vector3(...s.target)),
    []
  );

  const desiredPos = useRef(new THREE.Vector3().copy(cameras[0]));
  const desiredTarget = useRef(new THREE.Vector3().copy(targets[0]));
  const currentTarget = useRef(new THREE.Vector3().copy(targets[0]));
  const started = useRef(false);

  useFrame(({ camera }, delta) => {
    const segments = TOUR_STOPS.length - 1;
    const p = THREE.MathUtils.clamp(progressRef.current ?? 0, 0, 1);
    const seg = p * segments;
    const i = Math.min(Math.floor(seg), segments - 1);
    const t = smoothstep(seg - i);

    desiredPos.current.lerpVectors(cameras[i], cameras[i + 1], t);
    desiredTarget.current.lerpVectors(targets[i], targets[i + 1], t);

    if (!started.current) {
      // Snap on first frame so we don't fly in from the origin.
      camera.position.copy(desiredPos.current);
      currentTarget.current.copy(desiredTarget.current);
      started.current = true;
    } else {
      const k = 1 - Math.pow(0.0015, delta); // frame-rate independent damping
      camera.position.lerp(desiredPos.current, k);
      currentTarget.current.lerp(desiredTarget.current, k);
    }
    camera.lookAt(currentTarget.current);
  });

  return null;
}

export default function RoomTourCanvas({
  progressRef,
  active,
}: {
  progressRef: RefObject<number>;
  active: boolean;
}) {
  return (
    <Canvas
      shadows="percentage"
      frameloop={active ? "always" : "never"}
      dpr={[1, 1.25]}
      camera={{ fov: 42, near: 0.1, far: 40 }}
      gl={{ powerPreference: "high-performance" }}
    >
      <color attach="background" args={["#171513"]} />
      <fog attach="fog" args={["#171513", 12, 22]} />

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
      <Environment resolution={64}>
        <Lightformer intensity={2.1} position={[6, 3, 4]} scale={[4, 3, 1]} color="#fff4e6" />
        <Lightformer intensity={1.1} position={[-4, 4, -2]} scale={[3, 2, 1]} color="#e6ecf6" />
        <Lightformer intensity={0.5} position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[6, 6, 1]} color="#ffffff" />
      </Environment>

      <RoomGeometry />
      <TourCamera progressRef={progressRef} />
    </Canvas>
  );
}

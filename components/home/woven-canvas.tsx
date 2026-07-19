"use client";

/*
 * Woven light hero — adapted from "Woven Light Hero" by @dhileepkumargm
 * on 21st.dev (https://21st.dev/@dhileepkumargm/components/woven-light-hero).
 *
 * Brand + performance adaptations for ModernHome:
 *  - warm amber/brass particle palette (was rainbow) to match the LED world
 *  - particle count 50k → 16k, and an allocation-free per-frame loop
 *    (reused scratch vectors) to keep it smooth on mobile
 *  - DPR capped at 1.5, render paused when the tab is hidden
 *  - sizes to its container (not window), transparent background
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";

const PARTICLE_COUNT = 16000;

export default function WovenCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || window.innerWidth;
    const height = mount.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    mount.appendChild(renderer.domElement);

    const mouse = new THREE.Vector2(-10, -10);
    const clock = new THREE.Clock();

    // Weave the particles onto a torus-knot skeleton.
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const original = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const velocities = new Float32Array(PARTICLE_COUNT * 3);

    const geometry = new THREE.BufferGeometry();
    const knot = new THREE.TorusKnotGeometry(1.5, 0.5, 220, 32);
    const knotPos = knot.attributes.position;
    const color = new THREE.Color();

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const v = i % knotPos.count;
      const jitter = () => (Math.random() - 0.5) * 0.06;
      const x = knotPos.getX(v) + jitter();
      const y = knotPos.getY(v) + jitter();
      const z = knotPos.getZ(v) + jitter();
      positions[i * 3] = original[i * 3] = x;
      positions[i * 3 + 1] = original[i * 3 + 1] = y;
      positions[i * 3 + 2] = original[i * 3 + 2] = z;

      // Warm amber → brass palette (echoes the LED cove / brass reveals).
      color.setHSL(0.07 + Math.random() * 0.05, 0.65, 0.5 + Math.random() * 0.18);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    knot.dispose();

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.022,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });
    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const onMouseMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };
    window.addEventListener("mousemove", onMouseMove);

    // Reused scratch vectors — no per-particle allocation each frame.
    const mouseWorld = new THREE.Vector3();
    const dir = new THREE.Vector3();
    let raf = 0;
    let running = true;

    const animate = () => {
      if (!running) return;
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      mouseWorld.set(mouse.x * 3, mouse.y * 3, 0);

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const ix = i * 3;
        const iy = ix + 1;
        const iz = ix + 2;
        const px = positions[ix];
        const py = positions[iy];
        const pz = positions[iz];

        let vx = velocities[ix];
        let vy = velocities[iy];
        let vz = velocities[iz];

        // Cursor repulsion
        const dx = px - mouseWorld.x;
        const dy = py - mouseWorld.y;
        const dz = pz - mouseWorld.z;
        const distSq = dx * dx + dy * dy + dz * dz;
        if (distSq < 2.25) {
          const dist = Math.sqrt(distSq) || 0.0001;
          const force = (1.5 - dist) * 0.01;
          dir.set(dx / dist, dy / dist, dz / dist);
          vx += dir.x * force;
          vy += dir.y * force;
          vz += dir.z * force;
        }

        // Spring back to woven position, then damp
        vx = (vx + (original[ix] - px) * 0.001) * 0.95;
        vy = (vy + (original[iy] - py) * 0.001) * 0.95;
        vz = (vz + (original[iz] - pz) * 0.001) * 0.95;

        positions[ix] = px + vx;
        positions[iy] = py + vy;
        positions[iz] = pz + vz;
        velocities[ix] = vx;
        velocities[iy] = vy;
        velocities[iz] = vz;
      }
      geometry.attributes.position.needsUpdate = true;
      points.rotation.y = t * 0.05;
      renderer.render(scene, camera);
    };
    animate();

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        if (raf) cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        clock.getDelta();
        animate();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    const ro = new ResizeObserver(() => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(mount);

    return () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("visibilitychange", onVisibility);
      ro.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0" />;
}

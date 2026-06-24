import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Cloud } from '@react-three/drei';
import * as THREE from 'three';
import { useScroll } from 'framer-motion';

const noiseOverlayStyle = {
  backgroundBlendMode: "soft-light",
  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 600'%3E%3Cfilter id='a'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23a)'/%3E%3C/svg%3E\")",
  backgroundRepeat: "repeat",
  backgroundSize: "100px",
};

const NB_CLOUDS = 12;

const cloudConfigs = Array.from({ length: NB_CLOUDS }, (_, i) => {
  const depthLayer = Math.floor(i / 4);
  const depthScale = [1.5, 1, 0.6][depthLayer] || 0.6;
  const zRange = depthLayer === 0 ? [-12, -2] : depthLayer === 1 ? [-2, 8] : [8, 20];
  const z = zRange[0] + Math.random() * (zRange[1] - zRange[0]);
  const parallaxFactor = 1 + (z + 12) / 32;
  const speedLayer = 0.02 + depthLayer * 0.015;

  return {
    seed: i + 10,
    segments: 2,
    position: [
      (Math.random() - 0.5) * 40,
      -15 + Math.random() * 20,
      z,
    ],
    scale: 1.5 + Math.random() * 3 * depthScale,
    volume: 1 + Math.random() * 4,
    speed: 0.05 + Math.random() * 0.15,
    fade: 2 + Math.random() * 6,
    opacity: 0.15 + Math.random() * 0.45,
    bounds: [8 + Math.random() * 12, 6 + Math.random() * 8, 6 + Math.random() * 8],
    growth: 1 + Math.random() * 3,
    parallaxFactor,
    floatSpeed: 0.3 + Math.random() * 0.5,
    floatAmp: 0.1 + Math.random() * 0.3,
    zSpeed: speedLayer,
  };
});

function FloatingCloud({ config, scrollProgress }) {
  const ref = useRef();
  const startX = useRef(config.position[0]);
  const startY = useRef(config.position[1]);
  const startZ = useRef(config.position[2]);
  const timeOffset = useRef(Math.random() * 100);

  useFrame((state, delta) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime + timeOffset.current;
    const progress = scrollProgress.get();
    const parallaxX = (progress - 0.5) * 4 * config.parallaxFactor;
    ref.current.position.x = startX.current + Math.sin(t * config.floatSpeed) * config.floatAmp + parallaxX;
    ref.current.position.y = startY.current + Math.sin(t * config.floatSpeed * 0.7 + 1.3) * config.floatAmp * 0.6;
    ref.current.position.z = startZ.current + Math.sin(t * config.zSpeed) * 0.3;
    const rotY = Math.sin(t * 0.1 + config.seed) * 0.02;
    ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, rotY, 0.05);
  });

  return (
    <group ref={ref}>
      <Cloud
        seed={config.seed}
        segments={config.segments}
        concentrate="inside"
        bounds={config.bounds}
        growth={config.growth}
        position={[0, 0, 0]}
        smallestVolume={1}
        scale={config.scale}
        volume={config.volume}
        speed={config.speed}
        fade={config.fade}
        opacity={config.opacity}
        color="white"
        depthTest={false}
        transparent
      />
    </group>
  );
}

function CloudScene() {
  const { camera } = useThree();
  const { scrollYProgress } = useScroll();
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame((state, delta) => {
    const progress = scrollYProgress.get();
    const a = Math.min(Math.max(progress / 0.3, 0), 1);
    const b = Math.min(Math.max((progress - 0.3) / 0.2, 0), 1);
    const d = Math.min(Math.max((progress - 0.85) / 0.15, 0), 1);

    camera.rotation.x = THREE.MathUtils.damp(camera.rotation.x, -0.5 * Math.PI * a, 4, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, -37 * b, 5, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, 5 + 10 * d, 5, delta);

    const mx = mouseRef.current.x;
    const my = mouseRef.current.y;
    camera.rotation.y = THREE.MathUtils.damp(camera.rotation.y, mx * 0.05, 3, delta);
    camera.rotation.x = THREE.MathUtils.damp(
      camera.rotation.x,
      -0.5 * Math.PI * a + my * 0.03,
      3,
      delta
    );
  });

  return (
    <>
      <color attach="background" args={['#87CEEB']} />
      <fog attach="fog" args={['#B0D4F1', 20, 50]} />

      <directionalLight position={[10, 20, 5]} intensity={1.2} color="#FFF5E6" />
      <ambientLight intensity={0.6} color="#B0D4F1" />
      <hemisphereLight args={['#87CEEB', '#4a7c9e', 0.4]} />

      {cloudConfigs.map((cfg, idx) => (
        <FloatingCloud key={idx} config={cfg} scrollProgress={scrollYProgress} />
      ))}
    </>
  );
}

export default function BackgroundClouds() {
  const [showClouds, setShowClouds] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isLargeScreen = window.matchMedia('(min-width: 768px)').matches;
    const hasReasonablePerformance = navigator.hardwareConcurrency
      ? navigator.hardwareConcurrency >= 4
      : true;

    if (!prefersReducedMotion && isLargeScreen && hasReasonablePerformance) {
      setShowClouds(true);
    }
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0" style={{ ...noiseOverlayStyle }}>
      {showClouds && (
        <Canvas
          shadows={false}
          dpr={[1, 1.25]}
          camera={{ position: [0, 0, 5], fov: 70 }}
          gl={{ antialias: false, powerPreference: 'high-performance' }}
          style={{ background: 'linear-gradient(180deg, #4A90D9 0%, #87CEEB 40%, #B0D4F1 70%, #D4E6F1 100%)' }}
        >
          <CloudScene />
        </Canvas>
      )}
      {!showClouds && (
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, #4A90D9 0%, #87CEEB 40%, #B0D4F1 70%, #D4E6F1 100%)' }}
        />
      )}
    </div>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Clouds, Cloud } from '@react-three/drei';
import * as THREE from 'three';
import { useScroll } from 'framer-motion';

const noiseOverlayStyle = {
  backgroundBlendMode: "soft-light",
  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 600'%3E%3Cfilter id='a'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23a)'/%3E%3C/svg%3E\")",
  backgroundRepeat: "repeat",
  backgroundSize: "100px",
};

const CloudContainer = () => {
  return (
    <Clouds material={THREE.MeshBasicMaterial}
      position={[0, -5, 0]}
      frustumCulled={false}>
      <Cloud seed={1}
        segments={1}
        concentrate="inside"
        bounds={[10, 10, 10]}
        growth={3}
        position={[-1, 0, 0]}
        smallestVolume={2}
        scale={1.9}
        volume={2}
        speed={0.2}
        fade={5}
        />
      <Cloud
        seed={3}
        segments={1}
        concentrate="outside"
        bounds={[10, 10, 10]}
        growth={2}
        position={[2, 0, 2]}
        smallestVolume={2}
        scale={1}
        volume={2}
        fade={3}
        speed={0.1}/>

      <Cloud
        seed={4}
        segments={1}
        concentrate="outside"
        bounds={[10, 20, 15]}
        growth={4}
        position={[-10, -10, 4]}
        smallestVolume={2}
        scale={2}
        speed={0.2}
        volume={3}/>

      <Cloud
        seed={5}
        segments={1}
        concentrate="outside"
        bounds={[5, 5, 5]}
        growth={2}
        position={[6, -3, 8]}
        smallestVolume={2}
        scale={2}
        volume={2}
        fade={0.1}
        speed={0.1}/>

      <Cloud
        seed={6}
        segments={1}
        concentrate="outside"
        bounds={[5, 5, 5]}
        growth={2}
        position={[0, -20, 20]}
        smallestVolume={2}
        scale={4}
        volume={3}
        fade={0.1}
        speed={0.1}/>

      <Cloud
        seed={7}
        segments={1}
        concentrate="outside"
        bounds={[5, 5, 5]}
        growth={2}
        position={[10, -15, -5]}
        smallestVolume={2}
        scale={3}
        volume={3}
        fade={0.1}
        speed={0.1}/>
    </Clouds>);
}

const CameraController = () => {
  const { camera } = useThree();
  const { scrollYProgress } = useScroll();
  
  useFrame((state, delta) => {
    const progress = scrollYProgress.get();
    
    // Mimicking the scroll logic from ScrollWrapper:
    // a = range(0, 0.3)
    const a = Math.min(Math.max(progress / 0.3, 0), 1);
    // b = range(0.3, 0.5)
    const b = Math.min(Math.max((progress - 0.3) / 0.2, 0), 1);
    // d = range(0.85, 0.18) -> effectively range(0.85, 1.0)
    const d = Math.min(Math.max((progress - 0.85) / 0.15, 0), 1);

    camera.rotation.x = THREE.MathUtils.damp(camera.rotation.x, -0.5 * Math.PI * a, 5, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, -37 * b, 7, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, 5 + 10 * d, 7, delta);
  });
  
  return null;
};

export default function BackgroundClouds() {
  const [showClouds, setShowClouds] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isLargeScreen = window.matchMedia('(min-width: 1024px)').matches;
    const hasReasonablePerformance = navigator.hardwareConcurrency
      ? navigator.hardwareConcurrency >= 4
      : true;

    if (!prefersReducedMotion && isLargeScreen && hasReasonablePerformance) {
      setShowClouds(true);
    }
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0" style={{ backgroundColor: '#0690d4', ...noiseOverlayStyle }}>
      {showClouds && (
        <Canvas
          shadows={false}
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 5], fov: 75 }}
          gl={{ antialias: false, powerPreference: 'high-performance' }}
        >
          <ambientLight intensity={0.5} />
          <CloudContainer />
          <CameraController />
        </Canvas>
      )}
    </div>
  );
}

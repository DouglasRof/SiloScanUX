import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useSiloStore } from '../../store/useSiloStore'
import { SiloScene } from './SiloScene'

export function SiloCanvas() {
  const dims = useSiloStore((s) => s.dims)
  const target: [number, number, number] = [0, dims.cylinderHeightM * 0.45, 0]
  const camDistance = dims.diameterM * 2.3 + dims.cylinderHeightM * 0.35

  return (
    <div className="relative h-full w-full bg-linear-to-b from-(--color-app-from) to-(--color-app-to)">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [camDistance * 0.72, dims.cylinderHeightM * 0.85, camDistance * 0.72], fov: 38, near: 0.1, far: 500 }}
      >
        <Suspense fallback={null}>
          <hemisphereLight args={['#eaf5fc', '#8a9aa5', 0.65]} />
          <ambientLight intensity={0.35} />
          <directionalLight
            position={[dims.diameterM * 2, dims.cylinderHeightM * 3, dims.diameterM]}
            intensity={1.6}
            castShadow
            shadow-mapSize={[2048, 2048]}
          />
          <directionalLight position={[-dims.diameterM * 2, dims.cylinderHeightM, -dims.diameterM]} intensity={0.35} />
          <SiloScene />
          <OrbitControls
            target={target}
            enableDamping
            dampingFactor={0.08}
            minDistance={dims.diameterM * 0.9}
            maxDistance={dims.diameterM * 6}
            minPolarAngle={Math.PI * 0.12}
            maxPolarAngle={Math.PI * 0.49}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}

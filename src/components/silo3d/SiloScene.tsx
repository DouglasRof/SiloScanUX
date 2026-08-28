import { useSiloStore } from '../../store/useSiloStore'
import { SiloModel } from './SiloModel'
import { GrainBody } from './GrainBody'
import { Annotations } from './Annotations'

export function SiloScene() {
  const dims = useSiloStore((s) => s.dims)
  const volume = useSiloStore((s) => s.volume)

  return (
    <group>
      <SiloModel dims={dims} />
      <GrainBody dims={dims} volume={volume} />
      <Annotations dims={dims} volume={volume} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -dims.hopperHeightM - 0.11, 0]} receiveShadow>
        <circleGeometry args={[dims.diameterM * 1.8, 64]} />
        <shadowMaterial opacity={0.18} />
      </mesh>
    </group>
  )
}

import { useSiloStore } from '../../store/useSiloStore'
import { legClearanceM } from '../../lib/volume'
import { SiloModel } from './SiloModel'
import { GrainBody } from './GrainBody'
import { Annotations } from './Annotations'

export function SiloScene() {
  const dims = useSiloStore((s) => s.dims)
  const volume = useSiloStore((s) => s.volume)
  const groundY = -dims.hopperHeightM - Math.max(0.11, legClearanceM(dims))

  return (
    <group>
      <SiloModel dims={dims} />
      <GrainBody dims={dims} volume={volume} />
      <Annotations dims={dims} volume={volume} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, groundY, 0]} receiveShadow>
        <circleGeometry args={[dims.diameterM * 1.8, 64]} />
        <shadowMaterial opacity={0.18} />
      </mesh>
    </group>
  )
}

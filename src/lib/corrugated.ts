import * as THREE from 'three'

export function buildCorrugatedCylinderGeometry(
  radiusTop: number,
  radiusBottom: number,
  height: number,
  radialSegments = 96,
  ridgeCount = 48,
  ridgeDepth = 0.025,
  thetaStart = 0,
  thetaLength = Math.PI * 2,
): THREE.CylinderGeometry {
  const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments, 1, true, thetaStart, thetaLength)
  const pos = geometry.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)
    const angle = Math.atan2(z, x)
    const r = Math.sqrt(x * x + z * z)
    const ripple = Math.sin(angle * ridgeCount) * ridgeDepth
    const newR = r + ripple
    pos.setX(i, Math.cos(angle) * newR)
    pos.setZ(i, Math.sin(angle) * newR)
  }
  pos.needsUpdate = true
  geometry.computeVertexNormals()
  return geometry
}

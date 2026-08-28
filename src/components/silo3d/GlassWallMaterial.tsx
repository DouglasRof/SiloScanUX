import { useMemo } from 'react'
import * as THREE from 'three'

const VERTEX_SHADER = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vWorldPos;
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vWorldPos = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`

const FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uRimColor;
  uniform float uMinOpacity;
  uniform float uMaxOpacity;
  uniform float uPower;
  varying vec3 vNormalW;
  varying vec3 vWorldPos;
  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float facing = abs(dot(normalize(vNormalW), viewDir));
    float rim = pow(1.0 - facing, uPower);
    float alpha = mix(uMinOpacity, uMaxOpacity, rim);
    vec3 color = mix(uColor, uRimColor, rim);
    gl_FragColor = vec4(color, alpha);
  }
`

interface GlassWallMaterialProps {
  color?: string
  rimColor?: string
  minOpacity?: number
  maxOpacity?: number
  power?: number
}

/**
 * View-dependent "x-ray" shell: whichever face is turned toward the camera goes
 * near-transparent so the grain stays visible while orbiting, while the silhouette
 * (grazing-angle faces) stays opaque enough to read as a silo wall.
 */
export function GlassWallMaterial({
  color = '#b7c1c9',
  rimColor = '#eef3f7',
  minOpacity = 0.22,
  maxOpacity = 0.85,
  power = 1.1,
}: GlassWallMaterialProps) {
  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(color) },
      uRimColor: { value: new THREE.Color(rimColor) },
      uMinOpacity: { value: minOpacity },
      uMaxOpacity: { value: maxOpacity },
      uPower: { value: power },
    }),
    [color, rimColor, minOpacity, maxOpacity, power],
  )

  return (
    <shaderMaterial
      uniforms={uniforms}
      vertexShader={VERTEX_SHADER}
      fragmentShader={FRAGMENT_SHADER}
      transparent
      depthWrite={false}
      side={THREE.DoubleSide}
    />
  )
}

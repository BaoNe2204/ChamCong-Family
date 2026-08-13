import React, { useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'

export function BroomModel({ url, position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, delay = 0 }) {
  const { scene } = useGLTF(url)
  const group = useRef()
  
  // Custom floating animation with delay offset
  useFrame((state) => {
    if (group.current) {
      const t = state.clock.getElapsedTime() + delay
      group.current.position.y = position[1] + Math.sin(t) * 1.5 // Bobbing effect
    }
  })

  // Traverse to enable shadows
  scene.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true
      child.receiveShadow = true
    }
  })

  return (
    <group ref={group} position={position} rotation={rotation} scale={scale} dispose={null}>
      <primitive object={scene.clone(true)} />
    </group>
  )
}

useGLTF.preload('/broom-0.glb')
useGLTF.preload('/broom-1.glb')
useGLTF.preload('/broom-2.glb')
useGLTF.preload('/broom-3.glb')

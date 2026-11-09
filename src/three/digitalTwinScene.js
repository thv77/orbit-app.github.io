import * as THREE from 'three'

/**
 * High-Fidelity 3D Anatomical Digital Twin Engine for Spaceflight Physiological Monitoring.
 * Assembles a multi-layered astronaut bio-mannequin with microgravity adaptations:
 * - Cephalad fluid shift visualization
 * - Spinal elongation under microgravity
 * - Real-time cardiac pulse & respiratory ventilation
 * - Interactive organ raycasting & focal zoom
 */

export function mountDigitalTwin(canvas, options = {}) {
  if (!canvas) return () => {}

  const onSelect = options.onSelect || (() => {})
  const activeCrew = options.crewMember || 'Elena Vasquez'

  let renderer, frame, resize, onPointerDown, onPointerMove, onPointerUp, onClick
  let isDragging = false
  let prevPointerPos = { x: 0, y: 0 }
  let targetRotation = { x: 0.1, y: 0.0 }
  let currentRotation = { x: 0.1, y: 0.0 }
  let cameraTarget = new THREE.Vector3(0, 0.4, 0)
  let cameraCurrentTarget = new THREE.Vector3(0, 0.4, 0)
  let targetCameraDistance = 5.6
  let currentCameraDistance = 5.6

  let currentLayer = 'ALL_SYSTEMS' // ALL_SYSTEMS | CARDIOVASCULAR | SKELETAL | RESPIRATORY | NEURO_SANS
  const interactiveParts = []
  let hoveredObject = null

  try {
    const width = canvas.clientWidth || 600
    const height = canvas.clientHeight || 500

    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setSize(width, height, false)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, width / Math.max(height, 1), 0.1, 100)
    camera.position.set(0, 0.5, currentCameraDistance)

    // Lighting: Cool cyber-clinical ambient + dual rim key lights
    const hemiLight = new THREE.HemisphereLight(0x78d9f5, 0x07111e, 1.6)
    scene.add(hemiLight)

    const keyLight = new THREE.DirectionalLight(0x48d7f4, 2.2)
    keyLight.position.set(-3, 4, 4)
    scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0x3b82f6, 1.4)
    fillLight.position.set(3, 1, 3)
    scene.add(fillLight)

    const rimLight = new THREE.PointLight(0x4ce3bd, 4.5, 12)
    rimLight.position.set(0, 2, -3)
    scene.add(rimLight)

    // Background Cyber Grid Floor
    const gridHelper = new THREE.GridHelper(6, 24, 0x16344d, 0x091b2c)
    gridHelper.position.y = -2.1
    scene.add(gridHelper)

    // Holographic Base Ring
    const baseRingGeom = new THREE.RingGeometry(1.2, 1.25, 48)
    const baseRingMat = new THREE.MeshBasicMaterial({
      color: 0x48d7f4,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    })
    const baseRing = new THREE.Mesh(baseRingGeom, baseRingMat)
    baseRing.rotation.x = Math.PI / 2
    baseRing.position.y = -2.08
    scene.add(baseRing)

    // Main Bio-Mannequin Root Group
    const mannequinGroup = new THREE.Group()
    scene.add(mannequinGroup)

    // Sub-layer Groups
    const shellGroup = new THREE.Group()
    const skeletalGroup = new THREE.Group()
    const vascularGroup = new THREE.Group()
    const organGroup = new THREE.Group()
    const fluidParticlesGroup = new THREE.Group()

    mannequinGroup.add(shellGroup)
    mannequinGroup.add(skeletalGroup)
    mannequinGroup.add(vascularGroup)
    mannequinGroup.add(organGroup)
    mannequinGroup.add(fluidParticlesGroup)

    // Common Materials
    const shellMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x14344d,
      emissive: 0x0c2132,
      emissiveIntensity: 0.2,
      roughness: 0.3,
      metalness: 0.1,
      transmission: 0.82, // Translucent holographic look
      opacity: 0.45,
      transparent: true,
      depthWrite: false,
    })

    const boneMaterial = new THREE.MeshStandardMaterial({
      color: 0xc8e6f0,
      emissive: 0x1a3b4e,
      emissiveIntensity: 0.35,
      roughness: 0.35,
      metalness: 0.25,
    })

    const spineDiscMaterial = new THREE.MeshStandardMaterial({
      color: 0x48d7f4,
      emissive: 0x17566e,
      emissiveIntensity: 0.6,
      roughness: 0.2,
    })

    const heartMaterial = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: 0x9f1239,
      emissiveIntensity: 0.65,
      roughness: 0.25,
      metalness: 0.1,
    })

    const lungMaterial = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x075985,
      emissiveIntensity: 0.4,
      roughness: 0.4,
      transparent: true,
      opacity: 0.75,
    })

    const liverMaterial = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0x78350f,
      emissiveIntensity: 0.45,
      roughness: 0.4,
    })

    const helperAddPart = (group, geometry, material, name, pos, rot = [0, 0, 0], scale = [1, 1, 1]) => {
      const mesh = new THREE.Mesh(geometry, material)
      mesh.name = name
      mesh.position.set(...pos)
      mesh.rotation.set(...rot)
      mesh.scale.set(...scale)
      group.add(mesh)
      interactiveParts.push(mesh)
      return mesh
    }

    // 1. ANATOMICAL HEAD & CRANIUM
    const headGeom = new THREE.SphereGeometry(0.38, 28, 24)
    headGeom.scale(0.85, 1.15, 0.95)
    helperAddPart(shellGroup, headGeom, shellMaterial, 'Head & Cranium', [0, 1.95, 0])

    // Brain / Cranial Pressure Node (SANS indicator)
    const brainGeom = new THREE.SphereGeometry(0.24, 20, 18)
    brainGeom.scale(0.8, 0.95, 0.9)
    const brainMat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0x6b21a8,
      emissiveIntensity: 0.5,
      roughness: 0.3,
    })
    helperAddPart(organGroup, brainGeom, brainMat, 'Brain & Optic Nerve (SANS)', [0, 1.98, 0.02])

    // Neck
    const neckGeom = new THREE.CylinderGeometry(0.14, 0.16, 0.24, 16)
    helperAddPart(shellGroup, neckGeom, shellMaterial, 'Neck', [0, 1.58, 0])

    // 2. TORSO & THORAX
    const torsoGeom = new THREE.CylinderGeometry(0.48, 0.38, 1.05, 20)
    torsoGeom.scale(1.0, 1.0, 0.65)
    helperAddPart(shellGroup, torsoGeom, shellMaterial, 'Torso', [0, 0.98, 0])

    // Pelvis
    const pelvisGeom = new THREE.CylinderGeometry(0.38, 0.35, 0.38, 18)
    pelvisGeom.scale(1.05, 1.0, 0.7)
    helperAddPart(shellGroup, pelvisGeom, shellMaterial, 'Pelvis', [0, 0.32, 0])

    // 3. SKELETAL SYSTEM: Spine, Ribcage & Vertebrae
    // Visualizing 4.8 cm spaceflight spinal elongation
    const spineDiscs = []
    const vertebraeCount = 14
    for (let i = 0; i < vertebraeCount; i++) {
      const y = 0.48 + i * 0.082
      const discGeom = new THREE.CylinderGeometry(0.065, 0.07, 0.028, 12)
      const disc = helperAddPart(skeletalGroup, discGeom, spineDiscMaterial, 'Spine & Vertebrae', [0, y, -0.05])
      spineDiscs.push(disc)
    }

    // Ribcage arcs
    for (let r = 0; r < 5; r++) {
      const ribGeom = new THREE.TorusGeometry(0.34 - r * 0.018, 0.016, 8, 24, Math.PI * 1.4)
      const rib = new THREE.Mesh(ribGeom, boneMaterial)
      rib.rotation.x = Math.PI / 2 + 0.15
      rib.rotation.z = Math.PI * 0.3
      rib.position.set(0, 0.78 + r * 0.11, 0.02)
      skeletalGroup.add(rib)
    }

    // 4. ORGAN SYSTEM: Heart, Lungs, Liver
    // Heart (Pulsating)
    const heartGeom = new THREE.SphereGeometry(0.13, 20, 16)
    heartGeom.scale(0.85, 1.1, 0.8)
    const heartMesh = helperAddPart(organGroup, heartGeom, heartMaterial, 'Heart (Cardiovascular)', [-0.07, 1.08, 0.16], [0, 0, -0.2])

    // Left & Right Lungs (Ventilating)
    const lungGeomL = new THREE.CapsuleGeometry(0.12, 0.28, 8, 16)
    lungGeomL.scale(0.9, 1.0, 0.65)
    const lungL = helperAddPart(organGroup, lungGeomL, lungMaterial, 'Lungs (Pulmonary)', [-0.18, 1.12, 0.06], [0, 0, -0.15])

    const lungGeomR = new THREE.CapsuleGeometry(0.12, 0.28, 8, 16)
    lungGeomR.scale(0.9, 1.0, 0.65)
    const lungR = helperAddPart(organGroup, lungGeomR, lungMaterial, 'Lungs (Pulmonary)', [0.18, 1.12, 0.06], [0, 0, 0.15])

    // Liver
    const liverGeom = new THREE.SphereGeometry(0.18, 18, 16)
    liverGeom.scale(1.2, 0.65, 0.75)
    helperAddPart(organGroup, liverGeom, liverMaterial, 'Liver & Digestion', [0.12, 0.72, 0.12], [0, 0, -0.1])

    // 5. UPPER LIMBS: Shoulders, Arms & Hands
    // Left Arm
    const shoulderL = helperAddPart(skeletalGroup, new THREE.SphereGeometry(0.12, 12, 12), boneMaterial, 'Left Arm', [-0.62, 1.38, 0])
    const armUpperL = helperAddPart(shellGroup, new THREE.CapsuleGeometry(0.09, 0.44, 8, 14), shellMaterial, 'Left Arm', [-0.68, 1.02, 0], [0, 0, -0.12])
    const armLowerL = helperAddPart(shellGroup, new THREE.CapsuleGeometry(0.075, 0.42, 8, 14), shellMaterial, 'Left Arm', [-0.76, 0.52, 0], [0, 0, -0.06])

    // Right Arm
    const shoulderR = helperAddPart(skeletalGroup, new THREE.SphereGeometry(0.12, 12, 12), boneMaterial, 'Right Arm', [0.62, 1.38, 0])
    const armUpperR = helperAddPart(shellGroup, new THREE.CapsuleGeometry(0.09, 0.44, 8, 14), shellMaterial, 'Right Arm', [0.68, 1.02, 0], [0, 0, 0.12])
    const armLowerR = helperAddPart(shellGroup, new THREE.CapsuleGeometry(0.075, 0.42, 8, 14), shellMaterial, 'Right Arm', [0.76, 0.52, 0], [0, 0, 0.06])

    // 6. LOWER LIMBS: Thighs (Femurs with BMD stress), Legs & Feet
    // Femur Bone Density Heatmap material (lumbar & femur bone mass loss tracking)
    const femurMaterial = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.45,
      roughness: 0.3,
    })

    // Left Leg
    const femurL = helperAddPart(skeletalGroup, new THREE.CylinderGeometry(0.065, 0.055, 0.72, 14), femurMaterial, 'Left Leg (Femur BMD)', [-0.26, -0.22, 0], [0, 0, 0.04])
    const legUpperL = helperAddPart(shellGroup, new THREE.CapsuleGeometry(0.15, 0.65, 8, 16), shellMaterial, 'Left Leg', [-0.26, -0.22, 0], [0, 0, 0.04])
    const legLowerL = helperAddPart(shellGroup, new THREE.CapsuleGeometry(0.11, 0.68, 8, 16), shellMaterial, 'Left Leg', [-0.28, -0.96, 0])
    const footL = helperAddPart(shellGroup, new THREE.BoxGeometry(0.12, 0.08, 0.28), shellMaterial, 'Left Leg', [-0.28, -1.45, 0.08])

    // Right Leg
    const femurR = helperAddPart(skeletalGroup, new THREE.CylinderGeometry(0.065, 0.055, 0.72, 14), femurMaterial, 'Right Leg (Femur BMD)', [0.26, -0.22, 0], [0, 0, -0.04])
    const legUpperR = helperAddPart(shellGroup, new THREE.CapsuleGeometry(0.15, 0.65, 8, 16), shellMaterial, 'Right Leg', [0.26, -0.22, 0], [0, 0, -0.04])
    const legLowerR = helperAddPart(shellGroup, new THREE.CapsuleGeometry(0.11, 0.68, 8, 16), shellMaterial, 'Right Leg', [0.28, -0.96, 0])
    const footR = helperAddPart(shellGroup, new THREE.BoxGeometry(0.12, 0.08, 0.28), shellMaterial, 'Right Leg', [0.28, -1.45, 0.08])

    // 7. CEPHALAD FLUID SHIFT PARTICLES
    // Simulating venous fluid migration from legs upward to thorax & cranium
    const particleCount = 180
    const particleGeom = new THREE.BufferGeometry()
    const particlePositions = new Float32Array(particleCount * 3)
    const particleSeeds = []

    for (let p = 0; p < particleCount; p++) {
      const side = p % 2 === 0 ? -1 : 1
      const progress = Math.random()
      particleSeeds.push({ side, progress, speed: 0.003 + Math.random() * 0.005 })
    }

    particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
    const particleMat = new THREE.PointsMaterial({
      color: 0x48d7f4,
      size: 0.04,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    })
    const fluidParticles = new THREE.Points(particleGeom, particleMat)
    fluidParticlesGroup.add(fluidParticles)

    // Raycaster for Organ / Region Selection
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()

    const updatePointer = e => {
      const rect = canvas.getBoundingClientRect()
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    }

    onPointerDown = e => {
      isDragging = true
      prevPointerPos = { x: e.clientX, y: e.clientY }
    }

    onPointerMove = e => {
      updatePointer(e)
      if (isDragging) {
        const deltaX = e.clientX - prevPointerPos.x
        const deltaY = e.clientY - prevPointerPos.y
        prevPointerPos = { x: e.clientX, y: e.clientY }
        targetRotation.y += deltaX * 0.008
        targetRotation.x = Math.max(-0.45, Math.min(0.55, targetRotation.x + deltaY * 0.006))
      } else {
        // Hover highlighting
        raycaster.setFromCamera(pointer, camera)
        const intersects = raycaster.intersectObjects(interactiveParts)
        if (intersects.length > 0) {
          canvas.style.cursor = 'pointer'
          hoveredObject = intersects[0].object
        } else {
          canvas.style.cursor = isDragging ? 'grabbing' : 'grab'
          hoveredObject = null
        }
      }
    }

    onPointerUp = () => {
      isDragging = false
      canvas.style.cursor = 'grab'
    }

    onClick = e => {
      updatePointer(e)
      raycaster.setFromCamera(pointer, camera)
      const intersects = raycaster.intersectObjects(interactiveParts)
      if (intersects.length > 0) {
        const hit = intersects[0].object
        onSelect(hit.name)

        // Focus camera toward selected organ/region
        if (hit.name.includes('Heart')) {
          cameraTarget.set(0, 1.1, 0)
          targetCameraDistance = 3.6
        } else if (hit.name.includes('Head') || hit.name.includes('Brain')) {
          cameraTarget.set(0, 1.9, 0)
          targetCameraDistance = 3.2
        } else if (hit.name.includes('Spine')) {
          cameraTarget.set(0, 0.9, 0)
          targetCameraDistance = 3.8
        } else if (hit.name.includes('Leg')) {
          cameraTarget.set(0, -0.5, 0)
          targetCameraDistance = 4.2
        } else {
          cameraTarget.set(0, 0.4, 0)
          targetCameraDistance = 5.2
        }
      }
    }

    const onWheel = e => {
      e.preventDefault()
      targetCameraDistance = Math.max(2.5, Math.min(7.5, targetCameraDistance + e.deltaY * 0.003))
    }

    canvas.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('click', onClick)
    canvas.addEventListener('wheel', onWheel, { passive: false })

    // Resize Handler
    resize = () => {
      if (!canvas.clientWidth || !canvas.clientHeight) return
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    window.addEventListener('resize', resize)

    // Layer Switcher Handler
    const setLayer = layer => {
      currentLayer = layer
      if (layer === 'ALL_SYSTEMS') {
        shellGroup.visible = true
        skeletalGroup.visible = true
        organGroup.visible = true
        fluidParticlesGroup.visible = true
        shellMaterial.opacity = 0.45
      } else if (layer === 'CARDIOVASCULAR') {
        shellGroup.visible = true
        shellMaterial.opacity = 0.15 // Ghostly translucent shell
        skeletalGroup.visible = false
        organGroup.visible = true
        fluidParticlesGroup.visible = true
      } else if (layer === 'SKELETAL') {
        shellGroup.visible = true
        shellMaterial.opacity = 0.12
        skeletalGroup.visible = true
        organGroup.visible = false
        fluidParticlesGroup.visible = false
      } else if (layer === 'RESPIRATORY') {
        shellGroup.visible = true
        shellMaterial.opacity = 0.15
        skeletalGroup.visible = false
        organGroup.visible = true
        fluidParticlesGroup.visible = false
      } else if (layer === 'NEURO_SANS') {
        shellGroup.visible = true
        shellMaterial.opacity = 0.25
        skeletalGroup.visible = false
        organGroup.visible = true
        fluidParticlesGroup.visible = true
      }
    }
    canvas.__setLayer = setLayer

    // Reset Camera Focus
    const resetFocus = () => {
      cameraTarget.set(0, 0.4, 0)
      targetCameraDistance = 5.6
      targetRotation.set(0.1, 0.0)
    }
    canvas.__resetFocus = resetFocus

    // Animation Loop
    let time = 0
    const animate = () => {
      frame = requestAnimationFrame(animate)
      time += 0.018

      // Smooth camera dampening
      currentRotation.x += (targetRotation.x - currentRotation.x) * 0.08
      currentRotation.y += (targetRotation.y - currentRotation.y) * 0.08
      mannequinGroup.rotation.x = currentRotation.x
      mannequinGroup.rotation.y = currentRotation.y

      currentCameraDistance += (targetCameraDistance - currentCameraDistance) * 0.08
      cameraCurrentTarget.lerp(cameraTarget, 0.06)

      camera.position.z = currentCameraDistance
      camera.position.y = cameraCurrentTarget.y + 0.1
      camera.lookAt(cameraCurrentTarget)

      // 1. Systolic & Diastolic Cardiac Pulse (approx 68 BPM simulated)
      const heartPulse = 1.0 + Math.pow(Math.sin(time * 3.8), 4) * 0.16
      heartMesh.scale.set(0.85 * heartPulse, 1.1 * heartPulse, 0.8 * heartPulse)
      heartMaterial.emissiveIntensity = 0.5 + Math.pow(Math.sin(time * 3.8), 4) * 0.65

      // 2. Respiratory Pulmonary Ventilation Expansion
      const breathCycle = 1.0 + Math.sin(time * 1.1) * 0.08
      lungL.scale.set(0.9 * breathCycle, 1.0, 0.65 * breathCycle)
      lungR.scale.set(0.9 * breathCycle, 1.0, 0.65 * breathCycle)

      // 3. Spinal Microgravity Intervertebral Elongation Breath
      const spineFlex = Math.sin(time * 0.5) * 0.02
      spineDiscs.forEach((d, idx) => {
        d.position.y = 0.48 + idx * (0.082 + spineFlex * 0.01)
      })

      // 4. Cephalad Fluid Shift Particle Migration
      const pPositions = particleGeom.attributes.position.array
      for (let p = 0; p < particleCount; p++) {
        const seed = particleSeeds[p]
        seed.progress += seed.speed
        if (seed.progress > 1.0) seed.progress = 0

        // Progress 0 = legs (-1.3), Progress 1 = cranium (+1.9)
        const curY = -1.3 + seed.progress * 3.2
        let curX, curZ

        if (curY < 0.2) {
          // In lower limbs
          curX = seed.side * (0.26 + Math.sin(seed.progress * 10) * 0.04)
          curZ = Math.cos(seed.progress * 8) * 0.04
        } else if (curY < 1.4) {
          // In torso / aorta
          curX = seed.side * (0.08 + Math.sin(seed.progress * 12) * 0.06)
          curZ = 0.08 + Math.cos(seed.progress * 10) * 0.04
        } else {
          // In carotid arteries / head
          curX = seed.side * (0.12 + Math.sin(seed.progress * 15) * 0.04)
          curZ = 0.02 + Math.cos(seed.progress * 8) * 0.03
        }

        const idx = p * 3
        pPositions[idx] = curX
        pPositions[idx + 1] = curY
        pPositions[idx + 2] = curZ
      }
      particleGeom.attributes.position.needsUpdate = true

      // Subtle base ring rotation
      baseRing.rotation.z -= 0.002

      renderer.render(scene, camera)
    }
    animate()

    // Cleanup
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('click', onClick)
      canvas.removeEventListener('wheel', onWheel)
      renderer.dispose()

      // Traverse and dispose all geometries and materials
      mannequinGroup.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose())
          else obj.material.dispose()
        }
      })
      gridHelper.geometry.dispose()
      baseRingGeom.dispose()
      baseRingMat.dispose()
      particleGeom.dispose()
      particleMat.dispose()
    }
  } catch (err) {
    console.warn('Digital Twin WebGL init failed:', err)
    renderer?.dispose()
    return () => renderer?.dispose()
  }
}


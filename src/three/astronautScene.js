import * as THREE from 'three'

/**
 * 3D Astronaut Space Helmet & Suit Display for Crew Dossiers.
 * Procedurally assembled EVA helmet with gold reflective visor,
 * thermal micrometeoroid garment (TMG) neck ring, and crew color accents.
 */
export function mountAstronautHelmet(canvas, colorHex = 0x8b5cf6) {
  if (!canvas) return () => {}

  let renderer, frame, resize, onPointerDown, onPointerMove, onPointerUp
  let isDragging = false
  let prevMousePos = { x: 0, y: 0 }
  let targetRotation = { x: 0.1, y: 0.0 }
  let currentRotation = { x: 0.1, y: 0.0 }

  try {
    const width = canvas.clientWidth || 320
    const height = canvas.clientHeight || 320

    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setSize(width, height, false)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(36, width / Math.max(height, 1), 0.1, 50)
    camera.position.set(0, 0.2, 4.2)

    // Lighting
    const hemiLight = new THREE.HemisphereLight(0xd8efff, 0x07111f, 1.4)
    scene.add(hemiLight)

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5)
    keyLight.position.set(-2, 3, 3)
    scene.add(keyLight)

    const rimLight = new THREE.PointLight(colorHex, 5.0, 8)
    rimLight.position.set(2, -1, -2)
    scene.add(rimLight)

    const fillLight = new THREE.DirectionalLight(0x48d7f4, 1.2)
    fillLight.position.set(2, 1, 2)
    scene.add(fillLight)

    const helmetGroup = new THREE.Group()
    scene.add(helmetGroup)

    // 1. Helmet Outer Shell (White composite polycarbonate / Beta cloth)
    const shellGeom = new THREE.SphereGeometry(0.85, 36, 32)
    shellGeom.scale(1.0, 1.05, 0.95)
    const shellMat = new THREE.MeshStandardMaterial({
      color: 0xedf4fa,
      roughness: 0.35,
      metalness: 0.15,
    })
    const shell = new THREE.Mesh(shellGeom, shellMat)
    helmetGroup.add(shell)

    // 2. Extravehicular Gold Visor (Reflective gold vapor-deposited solar shield)
    const visorGeom = new THREE.SphereGeometry(0.72, 32, 28, 0, Math.PI * 2, 0, Math.PI * 0.6)
    visorGeom.scale(0.92, 0.85, 0.98)
    const visorMat = new THREE.MeshPhysicalMaterial({
      color: 0xffb703,
      emissive: 0x946100,
      emissiveIntensity: 0.2,
      metalness: 0.95,
      roughness: 0.08,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    })
    const visor = new THREE.Mesh(visorGeom, visorMat)
    visor.rotation.x = Math.PI / 2 + 0.18
    visor.position.set(0, 0.04, 0.22)
    helmetGroup.add(visor)

    // 3. Visor Protective Rim / Seal Ring
    const rimGeom = new THREE.TorusGeometry(0.72, 0.038, 12, 36, Math.PI * 1.3)
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.6,
      metalness: 0.4,
    })
    const visorRim = new THREE.Mesh(rimGeom, rimMat)
    visorRim.rotation.x = Math.PI / 2 + 0.18
    visorRim.rotation.z = Math.PI * 0.35
    visorRim.position.set(0, 0.04, 0.22)
    helmetGroup.add(visorRim)

    // 4. Neck Ring Assembly (Aluminium anodized docking ring)
    const neckRingGeom = new THREE.CylinderGeometry(0.68, 0.72, 0.18, 32)
    const neckRingMat = new THREE.MeshStandardMaterial({
      color: 0x8ea2b8,
      roughness: 0.25,
      metalness: 0.85,
    })
    const neckRing = new THREE.Mesh(neckRingGeom, neckRingMat)
    neckRing.position.set(0, -0.84, 0)
    helmetGroup.add(neckRing)

    // 5. Thermal Micrometeoroid Garment (TMG) Torso & Shoulders
    const torsoGeom = new THREE.CylinderGeometry(0.72, 0.95, 0.65, 28)
    torsoGeom.scale(1.2, 1.0, 0.75)
    const torsoMat = new THREE.MeshStandardMaterial({
      color: 0xd9e5f0,
      roughness: 0.55,
      metalness: 0.05,
    })
    const torso = new THREE.Mesh(torsoGeom, torsoMat)
    torso.position.set(0, -1.22, 0)
    helmetGroup.add(torso)

    // 6. Crew Role Colored Shoulder Stripe & Mission Insignia
    const stripeGeom = new THREE.CylinderGeometry(0.725, 0.82, 0.12, 28)
    stripeGeom.scale(1.21, 1.0, 0.76)
    const stripeMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: 0.35,
      roughness: 0.3,
    })
    const stripe = new THREE.Mesh(stripeGeom, stripeMat)
    stripe.position.set(0, -1.02, 0)
    helmetGroup.add(stripe)

    // 7. Helmet Mounted Lights (Dual LED Exploration Beacons)
    const lightGeom = new THREE.BoxGeometry(0.08, 0.06, 0.12)
    const lightMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3 })
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0x7dd3fc })

    const lightL = new THREE.Mesh(lightGeom, lightMat)
    lightL.position.set(-0.84, 0.32, 0.15)
    lightL.rotation.y = -0.3
    helmetGroup.add(lightL)

    const lightR = new THREE.Mesh(lightGeom, lightMat)
    lightR.position.set(0.84, 0.32, 0.15)
    lightR.rotation.y = 0.3
    helmetGroup.add(lightR)

    // Drag Interaction
    onPointerDown = e => {
      isDragging = true
      prevMousePos = { x: e.clientX, y: e.clientY }
    }

    onPointerMove = e => {
      if (!isDragging) return
      const deltaX = e.clientX - prevMousePos.x
      const deltaY = e.clientY - prevMousePos.y
      prevMousePos = { x: e.clientX, y: e.clientY }

      targetRotation.y += deltaX * 0.008
      targetRotation.x = Math.max(-0.45, Math.min(0.45, targetRotation.x + deltaY * 0.006))
    }

    onPointerUp = () => {
      isDragging = false
    }

    canvas.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)

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

    // Public API to update stripe color dynamically
    canvas.__updateColor = newColor => {
      stripeMat.color.set(newColor)
      stripeMat.emissive.set(newColor)
      rimLight.color.set(newColor)
    }

    // Animation Loop
    let time = 0
    const animate = () => {
      frame = requestAnimationFrame(animate)
      time += 0.015

      // Gentle floating buoyancy
      helmetGroup.position.y = Math.sin(time * 1.2) * 0.04

      // Inertial damping
      currentRotation.x += (targetRotation.x - currentRotation.x) * 0.08
      currentRotation.y += (targetRotation.y - currentRotation.y) * 0.08
      helmetGroup.rotation.x = currentRotation.x
      helmetGroup.rotation.y = currentRotation.y

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
      renderer.dispose()

      shellGeom.dispose()
      shellMat.dispose()
      visorGeom.dispose()
      visorMat.dispose()
      rimGeom.dispose()
      rimMat.dispose()
      neckRingGeom.dispose()
      neckRingMat.dispose()
      torsoGeom.dispose()
      torsoMat.dispose()
      stripeGeom.dispose()
      stripeMat.dispose()
      lightGeom.dispose()
      lightMat.dispose()
      bulbMat.dispose()
    }
  } catch (err) {
    console.warn('Astronaut Helmet 3D WebGL init failed:', err)
    renderer?.dispose()
    return () => renderer?.dispose()
  }
}


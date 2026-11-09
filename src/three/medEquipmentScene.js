import * as THREE from 'three'

/**
 * 3D Medical Equipment & Ultrasound Diagnostic Hub for Medical Bay.
 * Interactive rendering of the Butterfly iQ+ diagnostic ultrasound transducer,
 * charging base, and optical inspection reticle.
 */
export function mountMedEquipment(canvas) {
  if (!canvas) return () => {}

  let renderer, frame, resize, onPointerDown, onPointerMove, onPointerUp
  let isDragging = false
  let prevMousePos = { x: 0, y: 0 }
  let targetRotation = { x: 0.25, y: -0.35 }
  let currentRotation = { x: 0.25, y: -0.35 }

  try {
    const width = canvas.clientWidth || 320
    const height = canvas.clientHeight || 280

    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setSize(width, height, false)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(35, width / Math.max(height, 1), 0.1, 50)
    camera.position.set(0, 0.4, 3.8)

    // Lighting
    const hemiLight = new THREE.HemisphereLight(0xd8efff, 0x06111f, 1.5)
    scene.add(hemiLight)

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.8)
    keyLight.position.set(-2, 3, 3)
    scene.add(keyLight)

    const cyanRim = new THREE.PointLight(0x48d7f4, 5.0, 8)
    cyanRim.position.set(2, 1, -2)
    scene.add(cyanRim)

    const rootGroup = new THREE.Group()
    scene.add(rootGroup)

    // Base Charging Dock (Dark sleek medical polymer)
    const baseGeom = new THREE.CylinderGeometry(0.75, 0.85, 0.16, 32)
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x0f1c2c,
      roughness: 0.35,
      metalness: 0.4,
    })
    const baseDock = new THREE.Mesh(baseGeom, baseMat)
    baseDock.position.set(0, -0.65, 0)
    rootGroup.add(baseDock)

    // Glowing Holographic Calibration Ring on Dock
    const ringGeom = new THREE.RingGeometry(0.68, 0.72, 36)
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x48d7f4,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    })
    const ring = new THREE.Mesh(ringGeom, ringMat)
    ring.rotation.x = Math.PI / 2
    ring.position.set(0, -0.56, 0)
    rootGroup.add(ring)

    // Diagnostic Ultrasound Probe Group
    const probeGroup = new THREE.Group()
    probeGroup.position.set(0, 0.08, 0)
    rootGroup.add(probeGroup)

    // 1. Probe Ergonomic Handle
    const handleGeom = new THREE.CylinderGeometry(0.12, 0.09, 0.82, 24)
    handleGeom.scale(1.0, 1.0, 0.75)
    const handleMat = new THREE.MeshStandardMaterial({
      color: 0xeef5fc,
      roughness: 0.2,
      metalness: 0.1,
    })
    const handle = new THREE.Mesh(handleGeom, handleMat)
    handle.rotation.x = 0.2
    probeGroup.add(handle)

    // 2. Rubber Grip Side Accents
    const gripGeom = new THREE.BoxGeometry(0.24, 0.52, 0.12)
    const gripMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.85,
    })
    const grip = new THREE.Mesh(gripGeom, gripMat)
    grip.rotation.x = 0.2
    grip.position.set(0, 0, 0.02)
    probeGroup.add(grip)

    // 3. Transducer Acoustic Lens & Scan Head
    const headGeom = new THREE.BoxGeometry(0.28, 0.16, 0.14)
    const headMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.3,
      metalness: 0.7,
    })
    const head = new THREE.Mesh(headGeom, headMat)
    head.rotation.x = 0.2
    head.position.set(0, 0.44, -0.09)
    probeGroup.add(head)

    // 4. Acoustic Silicon Lens (Cyan glowing transducer surface)
    const lensGeom = new THREE.BoxGeometry(0.25, 0.02, 0.12)
    const lensMat = new THREE.MeshStandardMaterial({
      color: 0x48d7f4,
      emissive: 0x0284c7,
      emissiveIntensity: 0.65,
      roughness: 0.2,
    })
    const lens = new THREE.Mesh(lensGeom, lensMat)
    lens.rotation.x = 0.2
    lens.position.set(0, 0.52, -0.11)
    probeGroup.add(lens)

    // 5. Battery & Telemetry Link Status LED Indicator
    const ledGeom = new THREE.SphereGeometry(0.022, 12, 12)
    const ledMat = new THREE.MeshBasicMaterial({ color: 0x4ce3bd })
    const led = new THREE.Mesh(ledGeom, ledMat)
    led.position.set(0, -0.18, 0.14)
    probeGroup.add(led)

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
      targetRotation.x = Math.max(-0.4, Math.min(0.5, targetRotation.x + deltaY * 0.006))
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

    // Animation Loop
    let time = 0
    const animate = () => {
      frame = requestAnimationFrame(animate)
      time += 0.016

      // Floating probe hovering subtly over dock
      probeGroup.position.y = 0.08 + Math.sin(time * 1.5) * 0.03
      ring.rotation.z += 0.005

      // LED pulse
      ledMat.color.setRGB(0.2, 0.8 + Math.sin(time * 4) * 0.15, 0.6)

      // Damped rotation
      currentRotation.x += (targetRotation.x - currentRotation.x) * 0.08
      currentRotation.y += (targetRotation.y - currentRotation.y) * 0.08
      rootGroup.rotation.x = currentRotation.x
      rootGroup.rotation.y = currentRotation.y

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

      baseGeom.dispose()
      baseMat.dispose()
      ringGeom.dispose()
      ringMat.dispose()
      handleGeom.dispose()
      handleMat.dispose()
      gripGeom.dispose()
      gripMat.dispose()
      headGeom.dispose()
      headMat.dispose()
      lensGeom.dispose()
      lensMat.dispose()
      ledGeom.dispose()
      ledMat.dispose()
    }
  } catch (err) {
    console.warn('Medical Equipment 3D WebGL init failed:', err)
    renderer?.dispose()
    return () => renderer?.dispose()
  }
}


import * as THREE from 'three'

/**
 * Creates high-detail procedural canvas textures for photorealistic Earth rendering.
 * Zero external network downloads required - completely offline and deterministic.
 */
function createEarthTextures() {
  const width = 2048
  const height = 1024

  // 1. Day Surface (Albedo + Relief)
  const surfaceCanvas = document.createElement('canvas')
  surfaceCanvas.width = width
  surfaceCanvas.height = height
  const ctx = surfaceCanvas.getContext('2d')

  // Base deep ocean gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height)
  oceanGrad.addColorStop(0, '#0a213e')
  oceanGrad.addColorStop(0.2, '#0c2e56')
  oceanGrad.addColorStop(0.5, '#071f3d')
  oceanGrad.addColorStop(0.8, '#0a2c52')
  oceanGrad.addColorStop(1, '#0e2440')
  ctx.fillStyle = oceanGrad
  ctx.fillRect(0, 0, width, height)

  // Procedural continental landmasses approximation
  // Generate continents with organic coastlines, terrain variation & deserts
  function hash(x, y) {
    const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
    return s - Math.floor(s)
  }

  function noise(x, y) {
    const ix = Math.floor(x)
    const iy = Math.floor(y)
    const fx = x - ix
    const fy = y - iy
    const ux = fx * fx * (3.0 - 2.0 * fx)
    const uy = fy * fy * (3.0 - 2.0 * fy)
    return (
      hash(ix, iy) * (1 - ux) * (1 - uy) +
      hash(ix + 1, iy) * ux * (1 - uy) +
      hash(ix, iy + 1) * (1 - ux) * uy +
      hash(ix + 1, iy + 1) * ux * uy
    )
  }

  function fbm(x, y, octaves = 6) {
    let val = 0
    let amp = 0.5
    let freq = 1
    for (let i = 0; i < octaves; i++) {
      val += amp * noise(x * freq, y * freq)
      freq *= 2.02
      amp *= 0.5
    }
    return val
  }

  // Draw landmasses on surface canvas
  const imgData = ctx.getImageData(0, 0, width, height)
  const data = imgData.data

  // Create night lights canvas
  const nightCanvas = document.createElement('canvas')
  nightCanvas.width = width
  nightCanvas.height = height
  const nightCtx = nightCanvas.getContext('2d')
  nightCtx.fillStyle = '#020308'
  nightCtx.fillRect(0, 0, width, height)
  const nightImgData = nightCtx.getImageData(0, 0, width, height)
  const nightData = nightImgData.data

  // Create specular mask canvas (water is reflective, land is diffuse)
  const specCanvas = document.createElement('canvas')
  specCanvas.width = width
  specCanvas.height = height
  const specCtx = specCanvas.getContext('2d')
  const specImgData = specCtx.getImageData(0, 0, width, height)
  const specData = specImgData.data

  for (let y = 0; y < height; y++) {
    const lat = (y / height) * Math.PI - Math.PI / 2
    const cosLat = Math.cos(lat)

    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const lon = (x / width) * Math.PI * 2 - Math.PI

      // Spherical coordinate mapping for noise
      const nx = Math.cos(lat) * Math.cos(lon)
      const ny = Math.sin(lat)
      const nz = Math.cos(lat) * Math.sin(lon)

      // Continental distribution shape + fractal detail
      const contBase =
        Math.sin(lon + 1.2) * 0.4 +
        Math.cos(lat * 1.8) * 0.35 +
        Math.sin(lon * 2.1 + lat) * 0.25
      const terrain = fbm(nx * 3.5 + 4.2, ny * 3.5 + nz * 3.5 + 1.7, 5)
      const elevation = contBase * 0.6 + terrain * 0.7

      const isPolar = Math.abs(ny) > 0.82
      const isSubPolar = Math.abs(ny) > 0.68

      if (elevation > 0.48 || isPolar) {
        // LAND / ICE
        let r, g, b
        if (isPolar || (isSubPolar && elevation > 0.52)) {
          // Glacial ice sheets
          r = 220 + Math.floor(elevation * 30)
          g = 235 + Math.floor(elevation * 20)
          b = 245
          specData[idx] = 160 // Ice has moderate specular
        } else {
          // Temperate forests, plains, deserts, mountains
          const isArid = Math.abs(ny) < 0.35 && terrain > 0.45
          const isMountain = elevation > 0.72

          if (isMountain) {
            // Rocky mountain crests
            r = 145 + Math.floor(terrain * 40)
            g = 135 + Math.floor(terrain * 30)
            b = 125 + Math.floor(terrain * 20)
          } else if (isArid) {
            // Sahara / Arabian desert tones
            r = 195 + Math.floor(terrain * 40)
            g = 160 + Math.floor(terrain * 35)
            b = 105 + Math.floor(terrain * 25)
          } else {
            // Lush biomes & grasslands
            r = 45 + Math.floor(terrain * 45)
            g = 95 + Math.floor(terrain * 65)
            b = 40 + Math.floor(terrain * 30)
          }
          specData[idx] = 20 // Land has very low specular
        }

        data[idx] = Math.min(255, r)
        data[idx + 1] = Math.min(255, g)
        data[idx + 2] = Math.min(255, b)
        data[idx + 3] = 255

        // Night city lights on land
        if (!isPolar && Math.abs(ny) < 0.75) {
          const cityCluster = noise(nx * 18.0 + 9.1, ny * 18.0 + nz * 18.0 + 3.2)
          if (cityCluster > 0.62) {
            const intensity = Math.pow((cityCluster - 0.62) / 0.38, 2) * 255
            nightData[idx] = Math.min(255, Math.floor(intensity * 1.0))     // Warm amber/gold
            nightData[idx + 1] = Math.min(255, Math.floor(intensity * 0.7)) // Golden yellow
            nightData[idx + 2] = Math.min(255, Math.floor(intensity * 0.3)) // Subtle blue
            nightData[idx + 3] = 255
          }
        }
      } else {
        // OCEAN
        const oceanDepth = (0.48 - elevation) / 0.48
        data[idx] = Math.floor(8 + 15 * (1 - oceanDepth))
        data[idx + 1] = Math.floor(35 + 40 * (1 - oceanDepth))
        data[idx + 2] = Math.floor(75 + 55 * (1 - oceanDepth))
        data[idx + 3] = 255

        // Water has high specular reflection
        specData[idx] = 245
      }
      specData[idx + 1] = specData[idx]
      specData[idx + 2] = specData[idx]
      specData[idx + 3] = 255
    }
  }

  ctx.putImageData(imgData, 0, 0)
  nightCtx.putImageData(nightImgData, 0, 0)
  specCtx.putImageData(specImgData, 0, 0)

  // 2. Cloud Texture
  const cloudCanvas = document.createElement('canvas')
  cloudCanvas.width = width
  cloudCanvas.height = height
  const cloudCtx = cloudCanvas.getContext('2d')
  const cloudImgData = cloudCtx.createImageData(width, height)
  const cloudData = cloudImgData.data

  for (let y = 0; y < height; y++) {
    const lat = (y / height) * Math.PI - Math.PI / 2
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const lon = (x / width) * Math.PI * 2 - Math.PI
      const nx = Math.cos(lat) * Math.cos(lon)
      const ny = Math.sin(lat)
      const nz = Math.cos(lat) * Math.sin(lon)

      // Swirling atmospheric cloud fronts
      const c1 = fbm(nx * 4.2 + 2.0, ny * 4.2 + nz * 4.2, 5)
      const c2 = fbm(nx * 8.5 + 5.0, ny * 8.5 + nz * 8.5, 4)
      const cloudDense = Math.max(0, (c1 * 0.7 + c2 * 0.3 - 0.42) / 0.58)
      const alpha = Math.floor(Math.pow(cloudDense, 1.4) * 225)

      cloudData[idx] = 248
      cloudData[idx + 1] = 252
      cloudData[idx + 2] = 255
      cloudData[idx + 3] = alpha
    }
  }
  cloudCtx.putImageData(cloudImgData, 0, 0)

  // Create Three.js Textures
  const dayTexture = new THREE.CanvasTexture(surfaceCanvas)
  dayTexture.colorSpace = THREE.SRGBColorSpace

  const nightTexture = new THREE.CanvasTexture(nightCanvas)
  nightTexture.colorSpace = THREE.SRGBColorSpace

  const specTexture = new THREE.CanvasTexture(specCanvas)

  const cloudTexture = new THREE.CanvasTexture(cloudCanvas)
  cloudTexture.colorSpace = THREE.SRGBColorSpace

  return { dayTexture, nightTexture, specTexture, cloudTexture }
}

/**
 * Creates a high-fidelity 3D Spacecraft model (ISS inspired).
 */
function createSpacecraftModel() {
  const station = new THREE.Group()

  // Central Integrated Truss Structure (long silver bar)
  const trussGeom = new THREE.BoxGeometry(0.7, 0.04, 0.04)
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xd8e6f0,
    metalness: 0.85,
    roughness: 0.25,
  })
  const truss = new THREE.Mesh(trussGeom, metalMat)
  station.add(truss)

  // Habitation & Laboratory pressurized cylindrical modules
  const habMat = new THREE.MeshStandardMaterial({
    color: 0xe4edf5,
    metalness: 0.7,
    roughness: 0.35,
  })
  const moduleA = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.26, 16), habMat)
  moduleA.rotation.x = Math.PI / 2
  station.add(moduleA)

  const moduleB = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.2, 16), habMat)
  moduleB.rotation.z = Math.PI / 2
  moduleB.position.set(0, 0, 0.09)
  station.add(moduleB)

  // Cupola observation bubble
  const cupolaMat = new THREE.MeshPhysicalMaterial({
    color: 0x48d7f4,
    metalness: 0.1,
    roughness: 0.1,
    transmission: 0.9,
    transparent: true,
  })
  const cupola = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 12), cupolaMat)
  cupola.position.set(0, -0.045, 0.04)
  station.add(cupola)

  // Photovoltaic Solar Array Wings (golden/blue reflective silicon panels)
  const solarMat = new THREE.MeshStandardMaterial({
    color: 0x163458,
    emissive: 0x091c32,
    emissiveIntensity: 0.3,
    metalness: 0.9,
    roughness: 0.15,
  })

  // 4 Solar Array Wings along the truss
  const wingPositions = [-0.3, -0.18, 0.18, 0.3]
  wingPositions.forEach(xPos => {
    const wingUpper = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.26, 0.005), solarMat)
    wingUpper.position.set(xPos, 0.15, 0)
    station.add(wingUpper)

    const wingLower = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.26, 0.005), solarMat)
    wingLower.position.set(xPos, -0.15, 0)
    station.add(wingLower)
  })

  // Thermal Radiator Panels
  const radMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 })
  const radiator1 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 0.003), radMat)
  radiator1.position.set(-0.07, 0.08, -0.06)
  station.add(radiator1)

  const radiator2 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 0.003), radMat)
  radiator2.position.set(0.07, 0.08, -0.06)
  station.add(radiator2)

  // Navigation strobe beacon
  const strobe = new THREE.PointLight(0x4ce3bd, 1.2, 0.8)
  strobe.position.set(0, 0.08, 0.12)
  station.add(strobe)

  station.scale.set(0.9, 0.9, 0.9)
  return { station, strobe }
}

/**
 * Mounts the high-fidelity Cinematic Mission Control Three.js Earth Environment.
 */
export function mountCinematicEarth(canvas, onTelemetryUpdate) {
  if (!canvas) return () => {}

  let renderer, frame, resize, onPointerDown, onPointerMove, onPointerUp
  let isDragging = false
  let prevMousePos = { x: 0, y: 0 }
  let targetRotation = { x: 0.2, y: -0.4 }
  let currentRotation = { x: 0.2, y: -0.4 }

  try {
    const width = canvas.clientWidth || window.innerWidth
    const height = canvas.clientHeight || window.innerHeight

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
    const camera = new THREE.PerspectiveCamera(42, width / Math.max(height, 1), 0.1, 1000)
    camera.position.set(0, 0.2, 5.4)

    // Deep Starfield with depth and subtle stellar colors
    const starCount = 1800
    const starGeom = new THREE.BufferGeometry()
    const starPositions = new Float32Array(starCount * 3)
    const starColors = new Float32Array(starCount * 3)

    for (let i = 0; i < starCount; i++) {
      const idx = i * 3
      const r = 25 + Math.random() * 45
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)

      starPositions[idx] = r * Math.sin(phi) * Math.cos(theta)
      starPositions[idx + 1] = r * Math.sin(phi) * Math.sin(theta)
      starPositions[idx + 2] = r * Math.cos(phi)

      // Varied stellar temperatures (cool white, ice cyan, soft amber)
      const tint = Math.random()
      if (tint > 0.8) {
        starColors[idx] = 0.58; starColors[idx + 1] = 0.84; starColors[idx + 2] = 1.0 // Cyan-blue
      } else if (tint > 0.65) {
        starColors[idx] = 1.0; starColors[idx + 1] = 0.88; starColors[idx + 2] = 0.72 // Warm gold
      } else {
        starColors[idx] = 0.88; starColors[idx + 1] = 0.94; starColors[idx + 2] = 1.0 // Pure white
      }
    }
    starGeom.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
    starGeom.setAttribute('color', new THREE.BufferAttribute(starColors, 3))

    const starMat = new THREE.PointsMaterial({
      size: 0.035,
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
    })
    const starfield = new THREE.Points(starGeom, starMat)
    scene.add(starfield)

    // Generate high-resolution procedural Earth textures
    const textures = createEarthTextures()

    // 1. Earth Primary Mesh with Custom Day/Night/Specular Shader
    const earthRadius = 1.75
    const earthGeom = new THREE.SphereGeometry(earthRadius, 96, 96)
    const earthMat = new THREE.ShaderMaterial({
      uniforms: {
        tDay: { value: textures.dayTexture },
        tNight: { value: textures.nightTexture },
        tSpec: { value: textures.specTexture },
        uSunDirection: { value: new THREE.Vector3(-1.0, 0.45, 1.2).normalize() },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormalWorld;
        varying vec3 vViewDir;
        void main() {
          vUv = uv;
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vNormalWorld = normalize(mat3(modelMatrix) * normal);
          vViewDir = normalize(cameraPosition - worldPos.xyz);
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform sampler2D tDay;
        uniform sampler2D tNight;
        uniform sampler2D tSpec;
        uniform vec3 uSunDirection;
        varying vec2 vUv;
        varying vec3 vNormalWorld;
        varying vec3 vViewDir;

        void main() {
          vec3 normal = normalize(vNormalWorld);
          vec3 sunDir = normalize(uSunDirection);
          vec3 viewDir = normalize(vViewDir);

          float lightDot = dot(normal, sunDir);
          float dayFactor = smoothstep(-0.15, 0.22, lightDot);
          float nightFactor = 1.0 - dayFactor;

          vec4 dayColor = texture2D(tDay, vUv);
          vec4 nightColor = texture2D(tNight, vUv);
          float specularMask = texture2D(tSpec, vUv).r;

          // Ocean specular reflection (Sun glint on sea)
          vec3 halfVec = normalize(sunDir + viewDir);
          float specIntensity = pow(max(dot(normal, halfVec), 0.0), 32.0) * specularMask * dayFactor;
          vec3 specularGlint = vec3(1.0, 0.95, 0.88) * specIntensity * 1.35;

          // Twilight terminator atmosphere reddening
          float twilight = smoothstep(-0.25, 0.15, lightDot) * smoothstep(0.35, -0.05, lightDot);
          vec3 twilightGlow = vec3(0.95, 0.38, 0.15) * twilight * 0.45;

          // Composite Earth surface
          vec3 surface = mix(nightColor.rgb * 1.5, dayColor.rgb, dayFactor) + specularGlint + twilightGlow;

          // Subtle ocean limb Fresnel
          float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.2);
          surface += vec3(0.12, 0.52, 0.95) * fresnel * 0.38 * dayFactor;

          gl_FragColor = vec4(surface, 1.0);
        }
      `,
    })

    const earthGroup = new THREE.Group()
    earthGroup.position.set(0.9, -0.15, -0.6) // Framed gracefully beside cockpit HUD
    scene.add(earthGroup)

    const earthMesh = new THREE.Mesh(earthGeom, earthMat)
    earthGroup.add(earthMesh)

    // 2. Animated Atmospheric Clouds
    const cloudGeom = new THREE.SphereGeometry(earthRadius + 0.022, 72, 72)
    const cloudMat = new THREE.MeshStandardMaterial({
      map: textures.cloudTexture,
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
      blending: THREE.NormalBlending,
      roughness: 0.9,
    })
    const cloudMesh = new THREE.Mesh(cloudGeom, cloudMat)
    earthGroup.add(cloudMesh)

    // 3. Cinematic Atmospheric Scattering Rim Glow
    const atmosGeom = new THREE.SphereGeometry(earthRadius + 0.075, 64, 64)
    const atmosMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uSunDirection: { value: earthMat.uniforms.uSunDirection.value },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vNormal = normalize(mat3(modelMatrix) * normal);
          vViewDir = normalize(cameraPosition - worldPos.xyz);
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vViewDir;
        uniform vec3 uSunDirection;
        void main() {
          float rim = pow(1.0 - max(dot(vNormal, vViewDir), 0.0), 3.0);
          float sunDot = max(dot(vNormal, normalize(uSunDirection)), 0.0);
          vec3 atmosphericColor = mix(vec3(0.08, 0.42, 0.95), vec3(0.35, 0.82, 1.0), sunDot);
          gl_FragColor = vec4(atmosphericColor, rim * 0.72);
        }
      `,
    })
    const atmosMesh = new THREE.Mesh(atmosGeom, atmosMat)
    earthGroup.add(atmosMesh)

    // 4. Orbital Trajectory Path (51.6° Inclined LEO Orbit)
    const orbitRadius = earthRadius + 0.28
    const orbitCurve = new THREE.EllipseCurve(0, 0, orbitRadius, orbitRadius, 0, 2 * Math.PI, false, 0)
    const orbitPoints = orbitCurve.getPoints(120)
    const orbitGeom = new THREE.BufferGeometry().setFromPoints(
      orbitPoints.map(p => new THREE.Vector3(p.x, 0, p.y))
    )
    const orbitMat = new THREE.LineDashedMaterial({
      color: 0x48d7f4,
      dashSize: 0.12,
      gapSize: 0.06,
      transparent: true,
      opacity: 0.55,
    })
    const orbitLine = new THREE.Line(orbitGeom, orbitMat)
    orbitLine.computeLineDistances()
    orbitLine.rotation.x = (51.6 * Math.PI) / 180 // ISS 51.6° orbital inclination
    earthGroup.add(orbitLine)

    // 5. Orbiting Spacecraft Model (ISS / Orion inspired)
    const { station: spacecraft, strobe } = createSpacecraftModel()
    earthGroup.add(spacecraft)

    // Sunlight Directional Light & Ambient Sky Fill
    const sunLight = new THREE.DirectionalLight(0xfff6ea, 2.8)
    sunLight.position.set(-6, 3, 7)
    scene.add(sunLight)

    const ambientLight = new THREE.AmbientLight(0x0a1c32, 0.7)
    scene.add(ambientLight)

    // Earth ground stations pins (Houston, Madrid, Canberra, Baikonur)
    const groundStations = [
      { name: 'Houston Mission Control', lat: 29.5, lon: -95.0 },
      { name: 'Baikonur Cosmodrome', lat: 45.9, lon: 63.3 },
      { name: 'Madrid DSN Station', lat: 40.4, lon: -4.2 },
      { name: 'Canberra DSN Station', lat: -35.3, lon: 148.9 },
    ]

    const stationMarkers = new THREE.Group()
    const pinGeom = new THREE.SphereGeometry(0.018, 12, 12)
    const pinMat = new THREE.MeshBasicMaterial({ color: 0x4ce3bd })

    groundStations.forEach(st => {
      const phi = (90 - st.lat) * (Math.PI / 180)
      const theta = (st.lon + 180) * (Math.PI / 180)
      const x = -(earthRadius * Math.sin(phi) * Math.cos(theta))
      const z = earthRadius * Math.sin(phi) * Math.sin(theta)
      const y = earthRadius * Math.cos(phi)

      const pin = new THREE.Mesh(pinGeom, pinMat)
      pin.position.set(x, y, z)
      stationMarkers.add(pin)
    })
    earthMesh.add(stationMarkers)

    // Interactive Drag / Orbit Mechanics
    onPointerDown = e => {
      isDragging = true
      prevMousePos = { x: e.clientX, y: e.clientY }
    }

    onPointerMove = e => {
      if (!isDragging) return
      const deltaX = e.clientX - prevMousePos.x
      const deltaY = e.clientY - prevMousePos.y
      prevMousePos = { x: e.clientX, y: e.clientY }

      targetRotation.y += deltaX * 0.005
      targetRotation.x = Math.max(-0.65, Math.min(0.65, targetRotation.x + deltaY * 0.004))
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

    // Animation & Orbital Propagation Loop
    let orbitAngle = 0
    let strobeTimer = 0

    const animate = () => {
      frame = requestAnimationFrame(animate)

      // Smooth camera dampening
      currentRotation.x += (targetRotation.x - currentRotation.x) * 0.06
      currentRotation.y += (targetRotation.y - currentRotation.y) * 0.06
      earthGroup.rotation.x = currentRotation.x
      earthGroup.rotation.y = currentRotation.y

      // Constant slow axial Earth rotation
      earthMesh.rotation.y += 0.0006
      cloudMesh.rotation.y += 0.00085 // Differential cloud drift

      // Propagate spacecraft along 51.6° inclined orbit
      orbitAngle += 0.003
      const ox = Math.cos(orbitAngle) * orbitRadius
      const oz = Math.sin(orbitAngle) * orbitRadius
      const inclinedY = -Math.sin(orbitAngle) * Math.sin((51.6 * Math.PI) / 180) * orbitRadius
      const inclinedZ = Math.cos(orbitAngle) * Math.cos((51.6 * Math.PI) / 180) * orbitRadius

      spacecraft.position.set(ox, inclinedY, inclinedZ)
      spacecraft.rotation.y = -orbitAngle + Math.PI / 2
      spacecraft.rotation.x = Math.sin(orbitAngle) * 0.1

      // Strobe beacon flash
      strobeTimer += 0.03
      strobe.intensity = Math.sin(strobeTimer * 6) > 0.8 ? 1.8 : 0.05

      // Subtle starfield twinkling drift
      starfield.rotation.y -= 0.0001

      // Emit live telemetry to React UI
      if (onTelemetryUpdate && Math.random() < 0.08) {
        onTelemetryUpdate({
          altitude: '408.4',
          velocity: '7.662',
          subLat: (Math.sin(orbitAngle) * 51.6).toFixed(1),
          subLon: (((orbitAngle * 180) / Math.PI * 2) % 360 - 180).toFixed(1),
        })
      }

      renderer.render(scene, camera)
    }
    animate()

    // Public API for view transitions
    const setViewMode = mode => {
      if (mode === 'ORBITAL') {
        targetRotation = { x: 0.2, y: -0.4 }
        camera.position.set(0, 0.2, 5.4)
      } else if (mode === 'NADIR') {
        targetRotation = { x: 0.0, y: 0.0 }
        camera.position.set(0.9, -0.15, 3.8)
      } else if (mode === 'HORIZON') {
        targetRotation = { x: -0.28, y: -1.1 }
        camera.position.set(-0.5, 0.6, 4.4)
      }
    }

    // Attach view mode setter to canvas element for parent access
    canvas.__setViewMode = setViewMode

    // Cleanup
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      renderer.dispose()
      starGeom.dispose()
      starMat.dispose()
      earthGeom.dispose()
      earthMat.dispose()
      cloudGeom.dispose()
      cloudMat.dispose()
      atmosGeom.dispose()
      atmosMat.dispose()
      orbitGeom.dispose()
      orbitMat.dispose()
      textures.dayTexture.dispose()
      textures.nightTexture.dispose()
      textures.specTexture.dispose()
      textures.cloudTexture.dispose()
    }
  } catch (err) {
    console.warn('Cinematic Earth WebGL init failed:', err)
    renderer?.dispose()
    return () => renderer?.dispose()
  }
}


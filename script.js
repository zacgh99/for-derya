/* =====================================================
   Z&D'S JOURNAL — THREE.JS HYBRID REBUILD
   ===================================================== */

   document.addEventListener('DOMContentLoaded', () => {
    const hasThree = typeof THREE !== 'undefined';
    const canvas = document.getElementById('three-canvas');
    const hoverLabel = document.getElementById('hover-label');
    const introUi = document.getElementById('intro-ui');
    const beginBtn = document.getElementById('begin-btn');
  
    let scene;
    let camera;
    let renderer;
    let raycaster;
    let pointer;
    let clock;
  
    let clickableObjects = [];
    let hoveredObject = null;
    let hoveredMagicObject = null;
  
    let curtainsOpen = false;
    let leftCurtain;
    let rightCurtain;
  
    let floatingObjects = [];
    const magicalAuras = [];
    const magicalParticles = [];
    let auroraMesh;
    let shootingStars = [];
    let moonGlowGroup;
  
    /* =====================================================
       THREE.JS WORLD
       ===================================================== */
  
    if (hasThree && canvas) {
      initThreeScene();
      animate();
    } else if (hoverLabel) {
      hoverLabel.textContent = 'Three.js did not load. Use the buttons below to open each section.';
    }
  
    function initThreeScene() {
      scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x070414, 0.055);
  
      camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 100);
      camera.position.set(0, 1.7, 9.5);
  
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance'
      });
  
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  
      raycaster = new THREE.Raycaster();
      pointer = new THREE.Vector2();
      clock = new THREE.Clock();
  
      addLights();
      addBackground();
      addMoon();
      addCurtains();
      addAltarAndObjects();
      addParticles();
  
      window.addEventListener('resize', onResize);
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('click', onSceneClick);
    }
  
    function addLights() {
      const ambient = new THREE.AmbientLight(0x9b85ff, 0.34);
      scene.add(ambient);
  
      const moonLight = new THREE.DirectionalLight(0xbfd8ff, 1.35);
      moonLight.position.set(5, 8, 4);
      moonLight.castShadow = true;
      scene.add(moonLight);
  
      const goldLight = new THREE.PointLight(0xffc56a, 2.4, 16);
      goldLight.position.set(0, 1.2, 3.8);
      scene.add(goldLight);
  
      const magicLeft = new THREE.PointLight(0xc9a8ff, 1.4, 12);
      magicLeft.position.set(-3.6, 1.1, 2.5);
      scene.add(magicLeft);
  
      const magicRight = new THREE.PointLight(0xff7aa8, 1.0, 12);
      magicRight.position.set(3.8, 1.0, 2.5);
      scene.add(magicRight);
    }
  
    function addBackground() {
      const bgGeo = new THREE.SphereGeometry(60, 64, 40);
    
      const bgMat = new THREE.ShaderMaterial({
        side: THREE.BackSide,
        uniforms: {
          topColor: { value: new THREE.Color(0x02010a) },
          midColor: { value: new THREE.Color(0x120b3d) },
          bottomColor: { value: new THREE.Color(0x32184f) }
        },
        vertexShader: `
          varying vec3 vWorldPosition;
    
          void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 topColor;
          uniform vec3 midColor;
          uniform vec3 bottomColor;
          varying vec3 vWorldPosition;
    
          void main() {
            float h = normalize(vWorldPosition).y;
    
            vec3 col = mix(bottomColor, midColor, smoothstep(-0.75, 0.25, h));
            col = mix(col, topColor, smoothstep(0.1, 0.95, h));
    
            float romanticGlow = smoothstep(-0.3, 0.45, h) * 0.08;
            col += vec3(0.20, 0.10, 0.32) * romanticGlow;
    
            gl_FragColor = vec4(col, 1.0);
          }
        `
      });
    
      const bg = new THREE.Mesh(bgGeo, bgMat);
      scene.add(bg);
    
      addStarField(1900, 48, 0.018, 0xffffff);
      addStarField(620, 34, 0.035, 0xfff5d6);
      addStarField(220, 24, 0.06, 0xc9e0ff);
    
      addAuroraLights();
      addRomanticNebulaClouds();
      addShootingStarsSystem();
    }

    function addAuroraLights() {
      const auroraGeo = new THREE.PlaneGeometry(18, 5.8, 96, 20);
    
      const auroraMat = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: {
          time: { value: 0 }
        },
        vertexShader: `
          uniform float time;
          varying vec2 vUv;
          varying float vWave;
    
          void main() {
            vUv = uv;
    
            vec3 pos = position;
    
            float wave1 = sin(pos.x * 1.4 + time * 0.9) * 0.28;
            float wave2 = sin(pos.x * 2.7 - time * 1.2) * 0.16;
            float wave3 = sin(pos.x * 5.4 + time * 0.45) * 0.08;
    
            pos.y += wave1 + wave2 + wave3;
            pos.z += sin(pos.x * 1.8 + time) * 0.18;
    
            vWave = wave1 + wave2;
    
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: `
          uniform float time;
          varying vec2 vUv;
          varying float vWave;
    
          void main() {
            float verticalFade = smoothstep(0.0, 0.22, vUv.y) * (1.0 - smoothstep(0.75, 1.0, vUv.y));
            float sideFade = smoothstep(0.0, 0.12, vUv.x) * (1.0 - smoothstep(0.88, 1.0, vUv.x));
    
            float ribbon = sin(vUv.x * 18.0 + time * 1.3 + vWave * 5.0) * 0.5 + 0.5;
            ribbon = smoothstep(0.22, 0.95, ribbon);
    
            vec3 emerald = vec3(0.12, 1.0, 0.62);
            vec3 violet = vec3(0.65, 0.35, 1.0);
            vec3 pink = vec3(1.0, 0.35, 0.72);
    
            vec3 color = mix(emerald, violet, vUv.x);
            color = mix(color, pink, smoothstep(0.65, 1.0, vUv.x));
    
            float alpha = verticalFade * sideFade * (0.18 + ribbon * 0.34);
    
            gl_FragColor = vec4(color, alpha);
          }
        `
      });
    
      auroraMesh = new THREE.Mesh(auroraGeo, auroraMat);
      auroraMesh.position.set(0, 2.75, -7.5);
      auroraMesh.rotation.x = -0.08;
      scene.add(auroraMesh);
    
      const auroraGeo2 = new THREE.PlaneGeometry(15, 4.2, 80, 18);
      const aurora2 = new THREE.Mesh(auroraGeo2, auroraMat.clone());
      aurora2.position.set(-1.8, 1.95, -8.2);
      aurora2.rotation.z = 0.08;
      aurora2.rotation.x = -0.03;
      aurora2.material.uniforms = {
        time: { value: 0 }
      };
    
      scene.add(aurora2);
      floatingObjects.push(aurora2);
    }
    function addShootingStarsSystem() {
      for (let i = 0; i < 7; i++) {
        const star = createShootingStar();
        resetShootingStar(star, true);
        scene.add(star);
        shootingStars.push(star);
      }
    }
    
    function createShootingStar() {
      const group = new THREE.Group();
    
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.035, 16, 16),
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
    
      const trail = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.001, 1.6, 12, 1, true),
        new THREE.MeshBasicMaterial({
          color: 0xc9e0ff,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
    
      trail.rotation.z = Math.PI / 2;
      trail.position.x = -0.78;
    
      group.add(head);
      group.add(trail);
    
      group.userData.head = head;
      group.userData.trail = trail;
      group.userData.active = false;
      group.userData.delay = Math.random() * 6;
    
      return group;
    }
    
    function resetShootingStar(star, randomDelay = false) {
      star.position.set(
        -5 + Math.random() * 6,
        3.2 + Math.random() * 2.2,
        -4.5 - Math.random() * 4
      );
    
      star.rotation.z = -0.55 - Math.random() * 0.35;
    
      star.userData.velocity = new THREE.Vector3(
        0.055 + Math.random() * 0.035,
        -0.032 - Math.random() * 0.018,
        0
      );
    
      star.userData.life = 0;
      star.userData.maxLife = 1.2 + Math.random() * 0.7;
      star.userData.active = false;
      star.userData.delay = randomDelay ? Math.random() * 8 : 3 + Math.random() * 7;
    
      star.userData.head.material.opacity = 0;
      star.userData.trail.material.opacity = 0;
    }
    
    function animateShootingStars(delta) {
      shootingStars.forEach(star => {
        if (!star.userData.active) {
          star.userData.delay -= delta;
    
          if (star.userData.delay <= 0) {
            star.userData.active = true;
            star.userData.life = 0;
          }
    
          return;
        }
    
        star.userData.life += delta;
        star.position.add(star.userData.velocity);
    
        const progress = star.userData.life / star.userData.maxLife;
        const fadeIn = Math.min(progress * 5, 1);
        const fadeOut = 1 - Math.max((progress - 0.55) / 0.45, 0);
        const opacity = Math.max(0, Math.min(fadeIn, fadeOut));
    
        star.userData.head.material.opacity = opacity;
        star.userData.trail.material.opacity = opacity * 0.65;
    
        if (progress >= 1) {
          resetShootingStar(star);
        }
      });
    }

    function createNebulaTexture(colorA, colorB) {
      const nebulaCanvas = document.createElement('canvas');
      nebulaCanvas.width = 512;
      nebulaCanvas.height = 512;
    
      const ctx = nebulaCanvas.getContext('2d');
    
      const gradient = ctx.createRadialGradient(256, 256, 20, 256, 256, 256);
      gradient.addColorStop(0, colorA);
      gradient.addColorStop(0.35, colorB);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
    
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 512, 512);
    
      const texture = new THREE.CanvasTexture(nebulaCanvas);
      texture.needsUpdate = true;
      return texture;
    }
    
    function addRomanticNebulaClouds() {
      const nebulaData = [
        {
          position: [-4.2, 2.6, -8.5],
          scale: [4.6, 2.6, 1],
          colorA: 'rgba(201,168,255,0.45)',
          colorB: 'rgba(100,70,210,0.18)'
        },
        {
          position: [3.7, 1.9, -8.0],
          scale: [4.2, 2.4, 1],
          colorA: 'rgba(255,122,168,0.34)',
          colorB: 'rgba(120,50,160,0.14)'
        },
        {
          position: [0.2, -0.2, -9.2],
          scale: [6.5, 3.2, 1],
          colorA: 'rgba(80,170,255,0.22)',
          colorB: 'rgba(80,40,160,0.12)'
        }
      ];
    
      nebulaData.forEach(data => {
        const mat = new THREE.SpriteMaterial({
          map: createNebulaTexture(data.colorA, data.colorB),
          transparent: true,
          opacity: 0.75,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        });
    
        const cloud = new THREE.Sprite(mat);
        cloud.position.set(...data.position);
        cloud.scale.set(...data.scale);
        cloud.userData.nebula = true;
        cloud.userData.driftOffset = Math.random() * Math.PI * 2;
    
        scene.add(cloud);
        floatingObjects.push(cloud);
      });
    }

  
    function addStarField(count, radius, size, color) {
      const positions = new Float32Array(count * 3);
  
      for (let i = 0; i < count; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        const r = radius * (0.75 + Math.random() * 0.25);
  
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.cos(phi);
        positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      }
  
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
      const mat = new THREE.PointsMaterial({
        color,
        size,
        transparent: true,
        opacity: 0.88,
        depthWrite: false
      });
  
      const stars = new THREE.Points(geo, mat);
      stars.userData.spin = 0.00004 + Math.random() * 0.00005;
  
      scene.add(stars);
      floatingObjects.push(stars);
    }
  
function addMoon() {
  moonGlowGroup = new THREE.Group();
  moonGlowGroup.position.set(4.8, 4.1, -5.5);

  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(0.72, 64, 40),
    new THREE.MeshStandardMaterial({
      color: 0xffefd2,
      roughness: 0.82,
      metalness: 0.0,
      emissive: 0x5d4a7a,
      emissiveIntensity: 0.08
    })
  );

  moonGlowGroup.add(moon);

  const halo1 = new THREE.Mesh(
    new THREE.SphereGeometry(1.35, 48, 32),
    new THREE.MeshBasicMaterial({
      color: 0xffe4b8,
      transparent: true,
      opacity: 0.13,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );

  moonGlowGroup.add(halo1);

  const halo2 = new THREE.Mesh(
    new THREE.SphereGeometry(2.15, 48, 32),
    new THREE.MeshBasicMaterial({
      color: 0xc9a8ff,
      transparent: true,
      opacity: 0.055,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );

  moonGlowGroup.add(halo2);

  const crescentGlow = new THREE.Mesh(
    new THREE.TorusGeometry(0.82, 0.018, 12, 120),
    new THREE.MeshBasicMaterial({
      color: 0xfff5d6,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );

  crescentGlow.rotation.x = Math.PI / 2;
  crescentGlow.scale.set(1.05, 1.05, 1);
  moonGlowGroup.add(crescentGlow);

  scene.add(moonGlowGroup);
  floatingObjects.push(moonGlowGroup);
}
  
    function createCurtain(side) {
      const width = 5.75;
      const height = 9.0;
      const geo = new THREE.PlaneGeometry(width, height, 64, 90);
  
      const mat = new THREE.MeshStandardMaterial({
        color: 0x8f151c,
        roughness: 0.92,
        metalness: 0.04,
        side: THREE.DoubleSide,
        emissive: 0x290003,
        emissiveIntensity: 0.08
      });
  
      const mesh = new THREE.Mesh(geo, mat);
  
      mesh.position.set(side === 'left' ? -2.85 : 2.85, 0.5, 1.65);
      mesh.rotation.y = side === 'left' ? 0.10 : -0.10;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
  
      mesh.userData.basePositions = geo.attributes.position.array.slice();
      mesh.userData.side = side;
  
      return mesh;
    }
  
    function addCurtains() {
      leftCurtain = createCurtain('left');
      rightCurtain = createCurtain('right');
  
      scene.add(leftCurtain, rightCurtain);
  
      const rodMat = new THREE.MeshStandardMaterial({
        color: 0xd9a441,
        roughness: 0.45,
        metalness: 0.75,
        emissive: 0x5f3608,
        emissiveIntensity: 0.15
      });
  
      const rod = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 11.6, 32),
        rodMat
      );
  
      rod.position.set(0, 5.1, 1.55);
      rod.rotation.z = Math.PI / 2;
      scene.add(rod);
  
      const valance = new THREE.Mesh(
        new THREE.BoxGeometry(11.9, 0.45, 0.28),
        rodMat
      );
  
      valance.position.set(0, 4.75, 1.65);
      scene.add(valance);
    }
  
    function addAltarAndObjects() {
      const altarGeo = new THREE.CylinderGeometry(3.5, 4.1, 0.45, 80);
  
      const altarMat = new THREE.MeshStandardMaterial({
        color: 0x241a3f,
        roughness: 0.72,
        metalness: 0.1,
        emissive: 0x080516,
        emissiveIntensity: 0.25
      });
  
      const altar = new THREE.Mesh(altarGeo, altarMat);
      altar.position.set(0, -2.2, 0);
      altar.receiveShadow = true;
      scene.add(altar);
  
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(3.48, 0.025, 12, 160),
        new THREE.MeshStandardMaterial({
          color: 0xd9a441,
          roughness: 0.4,
          metalness: 0.8,
          emissive: 0x5c3408,
          emissiveIntensity: 0.2
        })
      );
  
      ring.position.set(0, -1.95, 0);
      ring.rotation.x = Math.PI / 2;
      scene.add(ring);
  
      const journal = createJournalObject();
      journal.position.set(-2.2, -1.25, 1.0);
      journal.rotation.set(-0.1, 0.35, -0.08);
      setClickable(journal, 'journal', 'Our Journal');
      addMagicAuraToObject(journal, {
        color: '#f3cc6a',
        secondaryColor: '#c9a8ff',
        scale: 1.2,
        ringScale: 0.9,
        particleCount: 18
      });
      scene.add(journal);
  
      const scroll = createScrollObject();
      scroll.position.set(2.1, -1.2, 1.0);
      scroll.rotation.set(0.08, -0.35, 0.04);
      setClickable(scroll, 'scroll', 'My Apology Letter');
      addMagicAuraToObject(scroll, {
        color: '#efddb6',
        secondaryColor: '#f3cc6a',
        scale: 1.05,
        ringScale: 0.85,
        particleCount: 14
      });
      scene.add(scroll);
  
      const gift = createGiftObject();
      gift.position.set(-1.55, -1.05, -1.15);
      gift.rotation.set(0, 0.25, 0);
      setClickable(gift, 'gift', 'Your Gift');
      addMagicAuraToObject(gift, {
        color: '#c9a8ff',
        secondaryColor: '#f3cc6a',
        scale: 1.15,
        ringScale: 0.95,
        particleCount: 20
      });
      scene.add(gift);
  
      const locket = createLocketObject();
      locket.position.set(1.7, -1.02, -1.1);
      locket.rotation.set(0.02, -0.25, 0);
      setClickable(locket, 'locket', 'A Locket to You');
      addMagicAuraToObject(locket, {
        color: '#4a8edd',
        secondaryColor: '#f3cc6a',
        scale: 1.1,
        ringScale: 0.85,
        particleCount: 18
      });
      scene.add(locket);
    }
  
    function createJournalObject() {
      const group = new THREE.Group();
  
      const coverMat = new THREE.MeshStandardMaterial({
        color: 0x5a1118,
        roughness: 0.72,
        metalness: 0.08,
        emissive: 0x170205,
        emissiveIntensity: 0.15
      });
  
      const pageMat = new THREE.MeshStandardMaterial({
        color: 0xefddb6,
        roughness: 0.85,
        metalness: 0.02
      });
  
      const goldMat = new THREE.MeshStandardMaterial({
        color: 0xd9a441,
        roughness: 0.36,
        metalness: 0.8,
        emissive: 0x4a2f0d,
        emissiveIntensity: 0.2
      });
  
      const cover = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.55, 0.18), coverMat);
      cover.castShadow = true;
      group.add(cover);
  
      const pages = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.45, 0.16), pageMat);
      pages.position.z = -0.11;
      group.add(pages);
  
      const emblem = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.015, 8, 44), goldMat);
      emblem.position.set(0, 0.22, 0.105);
      group.add(emblem);
  
      const spine = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.55, 0.23), coverMat);
      spine.position.x = -0.58;
      group.add(spine);
  
      addGlow(group, 0xc9a8ff, 0.85);
  
      group.userData.floatOffset = Math.random() * Math.PI * 2;
      floatingObjects.push(group);
  
      return group;
    }
  
    function createScrollObject() {
      const group = new THREE.Group();
  
      const paperMat = new THREE.MeshStandardMaterial({
        color: 0xefddb6,
        roughness: 0.82,
        metalness: 0.02
      });
  
      const goldMat = new THREE.MeshStandardMaterial({
        color: 0xd9a441,
        roughness: 0.35,
        metalness: 0.85,
        emissive: 0x4a2f0d,
        emissiveIntensity: 0.22
      });
  
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.55, 48), paperMat);
      body.rotation.z = Math.PI / 2;
      body.castShadow = true;
      group.add(body);
  
      const leftCap = new THREE.Mesh(new THREE.SphereGeometry(0.25, 32, 16), goldMat);
      leftCap.position.x = -0.85;
      group.add(leftCap);
  
      const rightCap = leftCap.clone();
      rightCap.position.x = 0.85;
      group.add(rightCap);
  
      const ribbon = new THREE.Mesh(
        new THREE.BoxGeometry(0.16, 0.56, 0.1),
        new THREE.MeshStandardMaterial({
          color: 0x8f151c,
          roughness: 0.75,
          metalness: 0.05
        })
      );
  
      ribbon.position.z = 0.19;
      group.add(ribbon);
  
      addGlow(group, 0xffd97e, 0.75);
  
      group.userData.floatOffset = Math.random() * Math.PI * 2;
      floatingObjects.push(group);
  
      return group;
    }
  
    function createGiftObject() {
      const group = new THREE.Group();
  
      const boxMat = new THREE.MeshStandardMaterial({
        color: 0x4a2d8f,
        roughness: 0.56,
        metalness: 0.15,
        emissive: 0x130824,
        emissiveIntensity: 0.22
      });
  
      const goldMat = new THREE.MeshStandardMaterial({
        color: 0xf3cc6a,
        roughness: 0.34,
        metalness: 0.78,
        emissive: 0x5a3509,
        emissiveIntensity: 0.18
      });
  
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.75, 1.05), boxMat);
      base.castShadow = true;
      group.add(base);
  
      const lid = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.25, 1.18), boxMat);
      lid.position.y = 0.5;
      group.add(lid);
  
      const ribbonV = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.9, 1.22), goldMat);
      ribbonV.position.y = 0.1;
      group.add(ribbonV);
  
      const ribbonH = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.91, 0.16), goldMat);
      ribbonH.position.y = 0.1;
      group.add(ribbonH);
  
      const bow = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.055, 12, 32), goldMat);
      bow.position.y = 0.75;
      bow.rotation.x = Math.PI / 2;
      group.add(bow);
  
      addGlow(group, 0xffd97e, 0.7);
  
      group.userData.floatOffset = Math.random() * Math.PI * 2;
      floatingObjects.push(group);
  
      return group;
    }
  
    function createLocketObject() {
      const group = new THREE.Group();
  
      const goldMat = new THREE.MeshStandardMaterial({
        color: 0xd9a441,
        roughness: 0.32,
        metalness: 0.9,
        emissive: 0x5a3509,
        emissiveIntensity: 0.2
      });
  
      const blueMat = new THREE.MeshStandardMaterial({
        color: 0x1e5cb8,
        roughness: 0.36,
        metalness: 0.2,
        emissive: 0x061a42,
        emissiveIntensity: 0.25
      });
  
      const pendant = new THREE.Mesh(new THREE.SphereGeometry(0.52, 48, 32), goldMat);
      pendant.scale.set(1, 1.12, 0.16);
      pendant.castShadow = true;
      group.add(pendant);
  
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.22, 32, 16), blueMat);
      eye.scale.set(1, 1, 0.12);
      eye.position.z = 0.11;
      group.add(eye);
  
      const chain = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.018, 8, 80), goldMat);
      chain.position.y = 0.58;
      chain.scale.y = 0.55;
      group.add(chain);
  
      addGlow(group, 0x4a8edd, 0.72);
  
      group.userData.floatOffset = Math.random() * Math.PI * 2;
      floatingObjects.push(group);
  
      return group;
    }
  
    function addGlow(group, color, scale) {
      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(scale, 32, 16),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.08,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
  
      glow.userData.isGlow = true;
      group.add(glow);
    }
  
    function setClickable(group, target, label) {
      group.userData.target = target;
      group.userData.label = label;
  
      group.traverse(child => {
        child.userData.target = target;
        child.userData.label = label;
        child.userData.rootObject = group;
      });
  
      clickableObjects.push(group);
    }
  
    function addParticles() {
      const count = 500;
      const positions = new Float32Array(count * 3);
  
      for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 11;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 7;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
      }
  
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
      const mat = new THREE.PointsMaterial({
        color: 0xc9a8ff,
        size: 0.025,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
  
      const points = new THREE.Points(geo, mat);
      points.userData.particles = true;
  
      scene.add(points);
      floatingObjects.push(points);
    }
  
    /* =====================================================
       MAGICAL OBJECT AURAS + HOVER EFFECTS
       ===================================================== */
  
    function createSoftGlowTexture(color = '#f3cc6a') {
      const glowCanvas = document.createElement('canvas');
      glowCanvas.width = 256;
      glowCanvas.height = 256;
  
      const ctx = glowCanvas.getContext('2d');
      const gradient = ctx.createRadialGradient(128, 128, 8, 128, 128, 128);
  
      gradient.addColorStop(0, color);
      gradient.addColorStop(0.18, color);
      gradient.addColorStop(0.45, 'rgba(201, 168, 255, 0.45)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 256, 256);
  
      const texture = new THREE.CanvasTexture(glowCanvas);
      texture.needsUpdate = true;
  
      return texture;
    }
  
    function addMagicAuraToObject(object, options = {}) {
      const {
        color = '#f3cc6a',
        secondaryColor = '#c9a8ff',
        scale = 1.15,
        ringScale = 1,
        particleCount = 16
      } = options;
  
      const auraGroup = new THREE.Group();
  
      auraGroup.name = 'magic-aura-group';
      auraGroup.userData.parentObject = object;
      auraGroup.userData.baseScale = scale;
      auraGroup.userData.hovered = false;
      auraGroup.userData.spinOffset = Math.random() * Math.PI * 2;
  
      object.add(auraGroup);

      auraGroup.traverse(child => {
        child.raycast = () => {};
      });
  
      const glowTexture = createSoftGlowTexture(color);
  
      const glowMaterial = new THREE.SpriteMaterial({
        map: glowTexture,
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
  
      const glow = new THREE.Sprite(glowMaterial);
      glow.name = 'soft-idle-glow';
      glow.scale.set(1.8 * scale, 1.8 * scale, 1);
      glow.position.set(0, 0.05, -0.16);
      auraGroup.add(glow);
  
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.72 * ringScale, 0.012, 12, 96),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.38,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        })
      );
  
      ring.name = 'magic-idle-ring';
      ring.rotation.x = Math.PI / 2;
      ring.position.y = -0.56;
      auraGroup.add(ring);
  
      const ring2 = new THREE.Mesh(
        new THREE.TorusGeometry(0.95 * ringScale, 0.008, 12, 96),
        new THREE.MeshBasicMaterial({
          color: secondaryColor,
          transparent: true,
          opacity: 0.18,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        })
      );
  
      ring2.name = 'magic-outer-ring';
      ring2.rotation.x = Math.PI / 2;
      ring2.position.y = -0.58;
      auraGroup.add(ring2);
  
      const particleGeometry = new THREE.SphereGeometry(0.018, 10, 10);
  
      for (let i = 0; i < particleCount; i++) {
        const mat = new THREE.MeshBasicMaterial({
          color: i % 2 === 0 ? color : secondaryColor,
          transparent: true,
          opacity: 0.55,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        });
  
        const spark = new THREE.Mesh(particleGeometry, mat);
        spark.raycast = () => {};
        const angle = (i / particleCount) * Math.PI * 2;
        const radius = 0.8 + Math.random() * 0.28;
  
        spark.position.set(
          Math.cos(angle) * radius,
          -0.05 + Math.random() * 0.8,
          Math.sin(angle) * radius * 0.45
        );
  
        spark.userData = {
          angle,
          radius,
          speed: 0.35 + Math.random() * 0.35,
          heightOffset: Math.random() * Math.PI * 2,
          baseOpacity: 0.28 + Math.random() * 0.35,
          parentAura: auraGroup
        };
  
        auraGroup.add(spark);
        magicalParticles.push(spark);
      }
  
      magicalAuras.push(auraGroup);
      object.userData.magicAura = auraGroup;
  
      return auraGroup;
    }
  
    function pulseMagicAuras(time) {
      magicalAuras.forEach(aura => {
        const hovered = aura.userData.hovered;
        const base = aura.userData.baseScale || 1;
        const offset = aura.userData.spinOffset || 0;
  
        const pulse = 1 + Math.sin(time * 2.1 + offset) * 0.045;
        const hoverBoost = hovered ? 1.22 : 1;
  
        aura.scale.setScalar(pulse * hoverBoost);
  
        const glow = aura.getObjectByName('soft-idle-glow');
        const ring = aura.getObjectByName('magic-idle-ring');
        const ring2 = aura.getObjectByName('magic-outer-ring');
  
        if (glow) {
          glow.material.opacity += ((hovered ? 0.78 : 0.28) - glow.material.opacity) * 0.08;
          glow.scale.set(1.8 * base * hoverBoost, 1.8 * base * hoverBoost, 1);
        }
  
        if (ring) {
          ring.rotation.z += hovered ? 0.018 : 0.005;
          ring.material.opacity += ((hovered ? 0.86 : 0.38) - ring.material.opacity) * 0.08;
        }
  
        if (ring2) {
          ring2.rotation.z -= hovered ? 0.012 : 0.003;
          ring2.material.opacity += ((hovered ? 0.42 : 0.18) - ring2.material.opacity) * 0.08;
        }
      });
  
      magicalParticles.forEach(spark => {
        const parentAura = spark.userData.parentAura;
        const hovered = parentAura?.userData.hovered;
  
        spark.userData.angle += spark.userData.speed * 0.012;
  
        const angle = spark.userData.angle;
        const radius = spark.userData.radius * (hovered ? 1.12 : 1);
        const yFloat = Math.sin(time * 2 + spark.userData.heightOffset) * 0.08;
  
        spark.position.x = Math.cos(angle) * radius;
        spark.position.z = Math.sin(angle) * radius * 0.45;
        spark.position.y += ((hovered ? 0.12 : -0.04) + yFloat - spark.position.y) * 0.025;
  
        spark.material.opacity += ((hovered ? 0.95 : spark.userData.baseOpacity) - spark.material.opacity) * 0.08;
  
        const scale = hovered ? 1.55 : 1;
        spark.scale.setScalar(scale);
      });
    }
  
    function setMagicHover(object, isHovered) {
      if (!object) return;
    
      const aura = object.userData.magicAura;
    
      if (aura) {
        aura.userData.hovered = isHovered;
      }
    
      object.traverse(child => {
        if (!child.material) return;
    
        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];
    
        materials.forEach(material => {
          if (!material.emissive) return;
    
          if (!material.userData.originalEmissive) {
            material.userData.originalEmissive = material.emissive.clone();
            material.userData.originalEmissiveIntensity = material.emissiveIntensity || 0;
          }
    
          if (isHovered) {
            material.emissive.set('#f3cc6a');
            material.emissiveIntensity = 0.55;
          } else {
            material.emissive.copy(material.userData.originalEmissive);
            material.emissiveIntensity = material.userData.originalEmissiveIntensity;
          }
    
          material.needsUpdate = true;
        });
      });
    }
    function clearAllMagicHover() {
      clickableObjects.forEach(object => {
        setMagicHover(object, false);
    
        object.scale.x += (1 - object.scale.x) * 0.35;
        object.scale.y += (1 - object.scale.y) * 0.35;
        object.scale.z += (1 - object.scale.z) * 0.35;
    
        if (object.userData.magicAura) {
          object.userData.magicAura.userData.hovered = false;
        }
      });
    
      hoveredMagicObject = null;
      hoveredObject = null;
    
      if (hoverLabel) {
        hoverLabel.textContent = '— hover the magic, then choose —';
      }
    
      document.body.style.cursor = 'default';
    }
    
    function isAnyOverlayOpen() {
      return !!document.querySelector('.overlay.is-open');
    }
  
    /* =====================================================
       RESIZE / POINTER / CLICK
       ===================================================== */
  
    function onResize() {
      if (!camera || !renderer) return;
  
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
  
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    }
  
    function onPointerMove(event) {
      if (!raycaster || !camera) return;
    
      if (isAnyOverlayOpen()) {
        clearAllMagicHover();
        return;
      }
    
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
      raycaster.setFromCamera(pointer, camera);
    
      const intersects = raycaster.intersectObjects(clickableObjects, true);
    
      if (intersects.length) {
        const hit = intersects.find(item => {
          const root = item.object.userData.rootObject || item.object.parent?.userData?.rootObject;
          return root && root.userData && root.userData.target;
        });
    
        if (hit) {
          const root = hit.object.userData.rootObject || hit.object.parent.userData.rootObject;
          setHoveredObject(root);
        } else {
          setHoveredObject(null);
        }
      } else {
        setHoveredObject(null);
      }
    }
  
    function setHoveredObject(object) {
      if (hoveredObject === object) return;
  
      if (hoveredMagicObject !== object) {
        setMagicHover(hoveredMagicObject, false);
        hoveredMagicObject = object;
        setMagicHover(hoveredMagicObject, true);
      }
  
      hoveredObject = object;
  
      if (hoverLabel) {
        hoverLabel.textContent = object && object.userData.label
          ? `— open ${object.userData.label} —`
          : '— hover the magic, then choose —';
      }
  
      document.body.style.cursor = object ? 'pointer' : 'default';
    }
  
    function onSceneClick() {
      if (!hoveredObject || !hoveredObject.userData.target) return;
    
      const target = hoveredObject.userData.target;
    
      clearAllMagicHover();
      openOverlay(target);
    }
  
    /* =====================================================
       ANIMATION LOOP
       ===================================================== */
  
    function animate() {
      if (!renderer || !scene || !camera) return;
  
      const t = clock.getElapsedTime();
      const delta = clock.getDelta();
  
      animateCurtains(t);
      animateFloatingObjects(t);
      pulseMagicAuras(t);
      animateRomanticBackdrop(t);
      animateShootingStars(delta);
  
      camera.position.x = Math.sin(t * 0.16) * 0.18;
      camera.position.y = 1.7 + Math.sin(t * 0.23) * 0.08;
      camera.lookAt(0, -0.55, 0);
  
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }

    function animateRomanticBackdrop(time) {
      if (auroraMesh && auroraMesh.material.uniforms?.time) {
        auroraMesh.material.uniforms.time.value = time;
      }
    
      floatingObjects.forEach(obj => {
        if (obj.userData.nebula) {
          const offset = obj.userData.driftOffset || 0;
          obj.position.x += Math.sin(time * 0.16 + offset) * 0.0009;
          obj.position.y += Math.cos(time * 0.12 + offset) * 0.0007;
          obj.material.opacity = 0.55 + Math.sin(time * 0.45 + offset) * 0.12;
        }
      });
    
      if (moonGlowGroup) {
        moonGlowGroup.rotation.y += 0.0008;
    
        moonGlowGroup.children.forEach((child, index) => {
          if (child.material && child.material.transparent) {
            const base = index === 1 ? 0.13 : index === 2 ? 0.055 : 0.22;
            child.material.opacity = base + Math.sin(time * 1.4 + index) * base * 0.18;
          }
        });
      }
    }
  
    function animateCurtains(t) {
      if (!leftCurtain || !rightCurtain) return;
  
      updateCurtainMesh(leftCurtain, t);
      updateCurtainMesh(rightCurtain, t + 0.35);
  
      const openAmount = curtainsOpen ? 1 : 0;
  
      leftCurtain.position.x += (((-6.2) * openAmount + (-2.85) * (1 - openAmount)) - leftCurtain.position.x) * 0.04;
      rightCurtain.position.x += (((6.2) * openAmount + (2.85) * (1 - openAmount)) - rightCurtain.position.x) * 0.04;
  
      leftCurtain.rotation.y += (((curtainsOpen ? 0.82 : 0.10) - leftCurtain.rotation.y) * 0.04);
      rightCurtain.rotation.y += (((curtainsOpen ? -0.82 : -0.10) - rightCurtain.rotation.y) * 0.04);
    }
  
    function updateCurtainMesh(mesh, t) {
      const arr = mesh.geometry.attributes.position.array;
      const base = mesh.userData.basePositions;
      const sideMul = mesh.userData.side === 'left' ? 1 : -1;
  
      for (let i = 0; i < arr.length; i += 3) {
        const x = base[i];
        const y = base[i + 1];
  
        const fold = Math.sin((x * 4.5 + t * 2.2) * sideMul) * 0.22;
        const ripple = Math.sin(y * 3.5 + t * 2.6 + x * 1.2) * 0.06;
        const deepFold = Math.sin(x * 9.0 + t * 1.4) * 0.04;
  
        arr[i + 2] = base[i + 2] + fold + ripple + deepFold;
        arr[i] = base[i] + Math.sin(y * 2.0 + t) * 0.025;
      }
  
      mesh.geometry.attributes.position.needsUpdate = true;
      mesh.geometry.computeVertexNormals();
    }
  
    function animateFloatingObjects(t) {
      floatingObjects.forEach(obj => {
        if (obj.userData.spin) {
          obj.rotation.y += obj.userData.spin;
          return;
        }
  
        if (obj.userData.particles) {
          obj.rotation.y += 0.0007;
          obj.position.y = Math.sin(t * 0.25) * 0.05;
          return;
        }
  
        if (obj.userData.floatOffset !== undefined) {
          // Objects stay still now. No bouncing.
        }
  
        const glow = obj.children.find(child => child.userData.isGlow);
  
        if (glow) {
          const isHovered = hoveredObject === obj;
  
          glow.material.opacity += ((isHovered ? 0.18 : 0.08) - glow.material.opacity) * 0.12;
          glow.scale.setScalar(isHovered ? 1.08 + Math.sin(t * 4) * 0.04 : 1);
        }
  
        if (hoveredObject === obj) {
          obj.scale.x += (1.08 - obj.scale.x) * 0.12;
          obj.scale.y += (1.08 - obj.scale.y) * 0.12;
          obj.scale.z += (1.08 - obj.scale.z) * 0.12;
        } else {
          obj.scale.x += (1 - obj.scale.x) * 0.12;
          obj.scale.y += (1 - obj.scale.y) * 0.12;
          obj.scale.z += (1 - obj.scale.z) * 0.12;
        }
      });
    }
  
    /* =====================================================
       BEGIN BUTTON
       ===================================================== */
  
    if (beginBtn) {
      beginBtn.addEventListener('click', () => {
        curtainsOpen = true;
        document.body.classList.add('curtains-opened');
        const bgMusic = document.getElementById('bg-music');

        if (bgMusic) {
          bgMusic.volume = 0.35;
          bgMusic.play().catch(() => {
            console.log('Background music was blocked by the browser.');
          });
        }
        

        if (introUi) {
          introUi.classList.add('is-hidden');
  
          setTimeout(() => {
            introUi.style.display = 'none';
          }, 900);
        }
  
        if (scene && scene.fog) {
          scene.fog.density = 0.012;
        }
      });
    }
    const bgMusic = document.getElementById('bg-music');
const musicToggle = document.getElementById('music-toggle');

if (musicToggle && bgMusic) {
  musicToggle.addEventListener('click', () => {
    if (bgMusic.paused) {
      bgMusic.volume = 0.35;
      bgMusic.play();
      musicToggle.textContent = '♪';
    } else {
      bgMusic.pause();
      musicToggle.textContent = '×';
    }
  });
}
  
    /* =====================================================
       OVERLAY OPEN / CLOSE
       ===================================================== */
  
    const openTriggers = document.querySelectorAll('[data-open]');
    const closeButtons = document.querySelectorAll('[data-close]');
    const overlays = document.querySelectorAll('.overlay');
  
    function openOverlay(target) {
      const overlay = document.getElementById(`overlay-${target}`);
      if (!overlay) return;
    
      clearAllMagicHover();
    
      overlay.classList.add('is-open');
      overlay.setAttribute('aria-hidden', 'false');
    
      if (target === 'scroll') {
        const scrollOpen = document.getElementById('scroll-open');
    
        if (scrollOpen) {
          scrollOpen.classList.remove('is-unrolled');
    
          // Force browser to restart the animation
          void scrollOpen.offsetWidth;
    
          scrollOpen.classList.add('is-unrolled');
        }
      }
    }
  
    openTriggers.forEach(trigger => {
      trigger.addEventListener('click', () => {
        openOverlay(trigger.dataset.open);
      });
    });
  
    closeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const overlay = btn.closest('.overlay');
        if (overlay) closeOverlay(overlay);
      });
    });
  
    overlays.forEach(overlay => {
      overlay.addEventListener('click', event => {
        if (event.target === overlay) closeOverlay(overlay);
      });
    });
  
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        const open = document.querySelector('.overlay.is-open');
        if (open) closeOverlay(open);
      }
    });
  
    function closeOverlay(overlay) {
      if (overlay.id === 'overlay-scroll') {
        const scrollOpen = document.getElementById('scroll-open');
        if (scrollOpen) scrollOpen.classList.remove('is-unrolled');
      }
    
      overlay.classList.remove('is-open');
      overlay.setAttribute('aria-hidden', 'true');
    
      if (overlay.id === 'overlay-journal') resetBook();
      if (overlay.id === 'overlay-gift') resetGift();
      if (overlay.id === 'overlay-locket') resetLocket();
    }
  
    /* =====================================================
       JOURNAL — 22 pages / 11 spreads
       ===================================================== */
  
    const book = document.getElementById('book');
    const spreads = book ? Array.from(book.querySelectorAll('.memory-spread')) : [];
    const prevBtn = document.getElementById('book-prev');
    const nextBtn = document.getElementById('book-next');
  
    let currentSpread = 0;
    let isTurning = false;
  
    function updateBookView() {
      spreads.forEach((spread, index) => {
        spread.classList.toggle('is-active', index === currentSpread);
        spread.classList.toggle('is-before', index < currentSpread);
        spread.classList.toggle('is-after', index > currentSpread);
    
        spread.classList.remove(
          'is-under-turn',
          'is-turning-next',
          'is-turning-prev'
        );
    
        spread.style.zIndex = index === currentSpread ? 5 : 1;
      });
    
      if (prevBtn) prevBtn.disabled = currentSpread === 0 || isTurning;
      if (nextBtn) nextBtn.disabled = currentSpread >= spreads.length - 1 || isTurning;
    }
  
    function pauseBookVideos(reset = false) {
      if (!book) return;
  
      book.querySelectorAll('video').forEach(video => {
        video.pause();
        if (reset) video.currentTime = 0;
      });
    }
  
    function createTurningPage(direction) {
      if (!book || !spreads[currentSpread]) return null;
    
      const current = spreads[currentSpread];
      const next = spreads[currentSpread + 1];
      const previous = spreads[currentSpread - 1];
    
      let pageToClone;
    
      if (direction === 'next') {
        pageToClone = current.querySelector('.memory-page-panel:last-child');
        if (next) {
          next.classList.add('is-under-turn');
          next.classList.remove('is-after');
        }
      } else {
        pageToClone = current.querySelector('.memory-page-panel:first-child');
        if (previous) {
          previous.classList.add('is-under-turn');
          previous.classList.remove('is-before');
        }
      }
    
      if (!pageToClone) return null;
    
      const turningPage = document.createElement('div');
      turningPage.className = direction === 'next'
        ? 'page-turner page-turner--next'
        : 'page-turner page-turner--prev';
    
      turningPage.innerHTML = pageToClone.outerHTML;
      book.appendChild(turningPage);
    
      requestAnimationFrame(() => {
        turningPage.classList.add('is-turning');
      });
    
      return turningPage;
    }
    
    function nextSpread() {
      if (isTurning || currentSpread >= spreads.length - 1) return;
    
      isTurning = true;
      pauseBookVideos();
    
      const turningPage = createTurningPage('next');
    
      if (prevBtn) prevBtn.disabled = true;
      if (nextBtn) nextBtn.disabled = true;
    
      setTimeout(() => {
        if (turningPage) turningPage.remove();
    
        currentSpread++;
        isTurning = false;
        updateBookView();
      }, 1050);
    }
    
    function prevSpread() {
      if (isTurning || currentSpread <= 0) return;
    
      isTurning = true;
      pauseBookVideos();
    
      const turningPage = createTurningPage('prev');
    
      if (prevBtn) prevBtn.disabled = true;
      if (nextBtn) nextBtn.disabled = true;
    
      setTimeout(() => {
        if (turningPage) turningPage.remove();
    
        currentSpread--;
        isTurning = false;
        updateBookView();
      }, 1050);
    }
  
    function resetBook() {
      currentSpread = 0;
      isTurning = false;
      pauseBookVideos(true);
      updateBookView();
    }
  
    if (nextBtn) nextBtn.addEventListener('click', nextSpread);
    if (prevBtn) prevBtn.addEventListener('click', prevSpread);
  
    if (book) {
      book.addEventListener('click', event => {
        const clickedButton = event.target.closest('button');
        const clickedVideo = event.target.closest('video');
        const clickedScrollable = event.target.closest('.book__text-scroll');
  
        if (clickedButton || clickedVideo || clickedScrollable || isTurning) return;
        nextSpread();
      });
    }
  
    updateBookView();
  
    /* =====================================================
       GIFT BOX
       ===================================================== */
  
    const gift3d = document.getElementById('gift-3d');
    const tickets = document.getElementById('tickets');
    const giftHint = document.getElementById('gift-hint');
  
    if (gift3d) {
      gift3d.addEventListener('click', () => {
        if (gift3d.classList.contains('is-open')) return;
    
        const giftStage = gift3d.closest('.gift-stage');
    
        gift3d.classList.add('is-open');
        if (giftStage) giftStage.classList.add('is-open');
        if (giftHint) giftHint.classList.add('is-hidden');
    
        setTimeout(() => {
          if (tickets) tickets.classList.add('is-revealed');
        }, 620);
    
        setTimeout(() => {
          gift3d.classList.add('is-vanished');
        }, 1150);
      });
    }
    
    function resetGift() {
      const giftStage = gift3d ? gift3d.closest('.gift-stage') : null;
    
      if (gift3d) {
        gift3d.classList.remove('is-open', 'is-vanished');
        gift3d.style.transform = '';
        gift3d.style.opacity = '';
      }
    
      if (giftStage) giftStage.classList.remove('is-open');
      if (tickets) tickets.classList.remove('is-revealed');
      if (giftHint) giftHint.classList.remove('is-hidden');
    }
  
    /* =====================================================
       LOCKET
       ===================================================== */
  
    const locketBig = document.getElementById('locket-big');
    const locketHint = document.getElementById('locket-hint');
  
    if (locketBig) {
      locketBig.addEventListener('click', () => {
        locketBig.classList.toggle('is-open');
  
        if (locketHint) {
          locketHint.classList.toggle('is-hidden', locketBig.classList.contains('is-open'));
        }
      });
    }
  
    function resetLocket() {
      if (locketBig) locketBig.classList.remove('is-open');
      if (locketHint) locketHint.classList.remove('is-hidden');
    }
  
    /* =====================================================
       MAGIC PULL-CORD SURPRISE
       ===================================================== */
  
    const magicPull = document.getElementById('magic-pull');
    const magicCord = document.getElementById('magic-cord');
  
    if (magicPull && magicCord) {
      let isDragging = false;
      let startY = 0;
      let currentPull = 0;
  
      const maxPull = 115;
      const revealDistance = 78;
  
      function setCordPull(amount) {
        currentPull = Math.max(0, Math.min(amount, maxPull));
        magicCord.style.height = 150 + currentPull + 'px';
        magicCord.style.transform = `translateX(-50%) rotate(${currentPull * 0.045}deg)`;
      }
  
      function resetCord() {
        magicCord.style.transition = 'height 0.55s cubic-bezier(0.22,1.35,0.32,1), transform 0.55s ease';
        setCordPull(0);
  
        setTimeout(() => {
          magicCord.style.transition = '';
          magicCord.style.transform = '';
          magicCord.style.animation = '';
        }, 580);
      }
  
      function revealSurprise() {
        magicPull.classList.add('is-pulled');
  
        magicCord.style.transition = 'height 0.6s cubic-bezier(0.22,1.35,0.32,1), transform 0.6s ease';
        magicCord.style.height = '245px';
        magicCord.style.transform = 'translateX(-50%) rotate(4deg)';
  
        setTimeout(() => {
          magicCord.style.transition = '';
        }, 650);
      }
  
      magicCord.addEventListener('pointerdown', event => {
        if (magicPull.classList.contains('is-pulled')) {
          magicPull.classList.remove('is-pulled');
          resetCord();
          return;
        }
  
        isDragging = true;
        startY = event.clientY;
  
        magicCord.setPointerCapture(event.pointerId);
        magicCord.style.animation = 'none';
        magicCord.style.transition = '';
      });
  
      magicCord.addEventListener('pointermove', event => {
        if (!isDragging) return;
        setCordPull(event.clientY - startY);
      });
  
      magicCord.addEventListener('pointerup', () => {
        if (!isDragging) return;
  
        isDragging = false;
  
        if (currentPull >= revealDistance) {
          revealSurprise();
        } else {
          resetCord();
        }
      });
  
      magicCord.addEventListener('pointercancel', () => {
        isDragging = false;
        resetCord();
      });
    }
  });
const beginButtonForMusic = document.getElementById("begin-btn");
const backgroundMusic = document.getElementById("bg-music");
const musicToggle = document.getElementById("music-toggle");

let musicPlaying = false;

function playBackgroundMusic() {
  if (!backgroundMusic) return;

  backgroundMusic.volume = 0.45;

  backgroundMusic.play()
    .then(() => {
      musicPlaying = true;
      if (musicToggle) musicToggle.textContent = "♫";
    })
    .catch(() => {
      console.log("Music was blocked until user interacts.");
    });
}

function toggleBackgroundMusic() {
  if (!backgroundMusic) return;

  if (backgroundMusic.paused) {
    playBackgroundMusic();
  } else {
    backgroundMusic.pause();
    musicPlaying = false;
    if (musicToggle) musicToggle.textContent = "♪";
  }
}

if (beginButtonForMusic) {
  beginButtonForMusic.addEventListener("click", playBackgroundMusic);
}

if (musicToggle) {
  musicToggle.addEventListener("click", toggleBackgroundMusic);
}

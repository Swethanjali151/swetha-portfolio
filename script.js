document.addEventListener("DOMContentLoaded", () => {
    
    // Initialize Lucide Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Core state management
    const state = {
        isLoaded: false,
        mouse: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
        cursorGlow: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
        canvasActive: false
    };

    /* ==========================================================================
       START SCREEN LOADER
       ========================================================================== */
    const loader = document.getElementById("loader");
    const loadingBar = document.getElementById("loading-bar");
    const startBtn = document.getElementById("start-btn");
    const navbar = document.getElementById("navbar");
    const loaderVideo = document.getElementById("loader-video");
    const soundToggleBtn = document.getElementById("sound-toggle-btn");
    
    // Ensure video properties are set and try to play immediately
    if (loaderVideo) {
        loaderVideo.volume = 1.0;
        loaderVideo.muted = true; // start muted for autoplay compliance
        
        // Try playing immediately
        loaderVideo.play().catch(err => {
            console.log("Muted autoplay blocked or waiting for interaction:", err);
        });
        
        loaderVideo.addEventListener('error', (e) => {
            console.error("Loader video error:", e);
        });
    }

    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += Math.floor(Math.random() * 15) + 5;
        if (progress >= 100) {
            progress = 100;
            clearInterval(progressInterval);
            
            // Show Start Button
            loadingBar.parentElement.style.opacity = "0";
            setTimeout(() => {
                loadingBar.parentElement.style.display = "none";
                startBtn.style.opacity = "1";
                startBtn.style.pointerEvents = "all";
            }, 300);
        }
        loadingBar.style.width = `${progress}%`;
    }, 100);

    let userInteractedForSound = false;

    startBtn.addEventListener("click", () => {
        // Pause loader video so audio stops playing
        if (loaderVideo) {
            loaderVideo.pause();
        }
        
        // Fade out loader
        loader.style.opacity = "0";
        loader.style.pointerEvents = "none";
        
        // Clean up document interaction listeners
        document.removeEventListener("click", autoUnmuteOnFirstClick);
        document.removeEventListener("touchstart", autoUnmuteOnFirstClick);
        
        setTimeout(() => {
            loader.style.display = "none";
            state.isLoaded = true;
            
            // Fade in navbar
            navbar.classList.add("visible");
            
            // Initialize canvas calculations
            state.canvasActive = true;
            initNeuralCanvas();
        }, 800);
    });

    function updateSoundButtonUI() {
        if (!soundToggleBtn || !loaderVideo) return;
        const icon = soundToggleBtn.querySelector("i");
        const label = soundToggleBtn.querySelector("span");
        
        if (loaderVideo.muted) {
            soundToggleBtn.style.opacity = "1";
            soundToggleBtn.style.pointerEvents = "all";
            icon.setAttribute("data-lucide", "volume-x");
            label.textContent = "Tap for Sound";
        } else {
            soundToggleBtn.style.opacity = "0";
            soundToggleBtn.style.pointerEvents = "none";
            icon.setAttribute("data-lucide", "volume-2");
            label.textContent = "Mute";
        }
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    // Handle Loader Video Sound Toggle
    if (soundToggleBtn && loaderVideo) {
        soundToggleBtn.addEventListener("click", (e) => {
            e.stopPropagation(); // prevent bubbling to document click
            userInteractedForSound = true;
            
            loaderVideo.muted = !loaderVideo.muted;
            
            if (!loaderVideo.muted) {
                // Ensure it plays when unmuted
                loaderVideo.play().catch(err => {
                    console.error("Failed to play video after unmuting:", err);
                });
            }
            
            updateSoundButtonUI();
        });
    }

    // Unmute on first click anywhere on the page if user hasn't toggled sound manually
    function autoUnmuteOnFirstClick(e) {
        // Don't unmute if clicking start-btn or if user already interacted with sound button
        if (e.target.closest('#start-btn') || e.target.closest('#sound-toggle-btn') || userInteractedForSound || !loaderVideo) {
            return;
        }
        
        loaderVideo.muted = false;
        loaderVideo.play()
            .then(() => {
                updateSoundButtonUI();
                // Success, remove listeners
                document.removeEventListener("click", autoUnmuteOnFirstClick);
                document.removeEventListener("touchstart", autoUnmuteOnFirstClick);
            })
            .catch(err => {
                console.log("Auto-unmute failed on click:", err);
            });
    }

    document.addEventListener("click", autoUnmuteOnFirstClick);
    document.addEventListener("touchstart", autoUnmuteOnFirstClick);

    /* ==========================================================================
       CUSTOM CURSOR
       ========================================================================== */
    const cursorDot = document.getElementById("cursor-dot");
    const cursorGlow = document.getElementById("cursor-glow");
    
    window.addEventListener("mousemove", (e) => {
        state.mouse.x = e.clientX;
        state.mouse.y = e.clientY;
        
        // Instant cursor dot
        cursorDot.style.transform = `translate3d(${state.mouse.x}px, ${state.mouse.y}px, 0)`;
    });

    // Spring interpolation physics for cursor glow
    const updateCursorGlow = () => {
        const dx = state.mouse.x - state.cursorGlow.x;
        const dy = state.mouse.y - state.cursorGlow.y;
        
        // 0.15 interpolation factor creates the smooth elastic lag
        state.cursorGlow.x += dx * 0.15;
        state.cursorGlow.y += dy * 0.15;
        
        cursorGlow.style.transform = `translate3d(${state.cursorGlow.x}px, ${state.cursorGlow.y}px, 0)`;
        
        requestAnimationFrame(updateCursorGlow);
    };
    requestAnimationFrame(updateCursorGlow);

    // Hover state links selector
    const interactiveElements = document.querySelectorAll("a, button, .project-card, .tab-btn, #hamburger-btn, .reset-form-btn");
    interactiveElements.forEach(el => {
        el.addEventListener("mouseenter", () => document.body.classList.add("cursor-hover"));
        el.addEventListener("mouseleave", () => document.body.classList.remove("cursor-hover"));
    });

    /* ==========================================================================
       3D AI NEURAL NETWORK & SYNAPSE SIMULATION (HERO)
       ========================================================================== */
    let canvas, ctx;
    let neuralNodes = [];
    let neuralLinks = [];
    let activeSignals = [];
    
    // Constant rotation angles updated over time
    let rotY = 0.002;
    let rotX = 0.0015;
    
    const fov = 400;
    const cameraDistance = 350;
    
    const initNeuralCanvas = () => {
        canvas = document.getElementById("neural-canvas");
        if (!canvas) return;
        ctx = canvas.getContext("2d");
        
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);
        
        buildNeuralNetwork();
        
        animateParticles();
    };

    const resizeCanvas = () => {
        if (!canvas) return;
        canvas.width = canvas.parentElement.offsetWidth;
        canvas.height = canvas.parentElement.offsetHeight;
    };

    const buildNeuralNetwork = () => {
        neuralNodes = [];
        neuralLinks = [];
        activeSignals = [];
        
        // Define layers configuration: [node count, X position]
        const layersConfig = [
            { count: 5, x: -220 }, // Input (Layer 0)
            { count: 7, x: -70 },  // Hidden 1 (Layer 1)
            { count: 7, x: 70 },   // Hidden 2 (Layer 2)
            { count: 4, x: 220 }   // Output (Layer 3)
        ];
        
        let nodeIndex = 0;
        
        // Create nodes
        layersConfig.forEach((layer, layerIdx) => {
            const count = layer.count;
            const xBase = layer.x;
            
            for (let i = 0; i < count; i++) {
                // Space out nodes vertically
                const yBase = ((i / (count - 1)) - 0.5) * 280;
                
                // Distribute on a cylinder-like shape in Z dimension for 3D depth
                let zVal = 0;
                let yVal = yBase;
                if (layerIdx === 1 || layerIdx === 2) {
                    const angle = (i / count) * Math.PI * 2;
                    zVal = Math.sin(angle) * 70;
                    yVal = yBase + Math.cos(angle) * 30;
                } else {
                    zVal = ((i / (count - 1)) - 0.5) * 40;
                }
                
                neuralNodes.push({
                    id: nodeIndex++,
                    layer: layerIdx,
                    baseX: xBase,
                    baseY: yVal,
                    baseZ: zVal,
                    x: xBase,
                    y: yVal,
                    z: zVal,
                    screenX: 0,
                    screenY: 0,
                    scale: 1,
                    glow: 0
                });
            }
        });
        
        // Connect nodes between layers
        const getNodesInLayer = (l) => neuralNodes.filter(n => n.layer === l);
        
        for (let l = 0; l < 3; l++) {
            const currentLayerNodes = getNodesInLayer(l);
            const nextLayerNodes = getNodesInLayer(l + 1);
            
            currentLayerNodes.forEach(source => {
                const numConnections = l === 2 ? nextLayerNodes.length : 3;
                const shuffled = [...nextLayerNodes].sort(() => 0.5 - Math.random());
                const targets = shuffled.slice(0, numConnections);
                
                targets.forEach(target => {
                    neuralLinks.push({
                        from: source.id,
                        to: target.id
                    });
                });
            });
        }
    };

    const spawnSignal = (sourceNodeId) => {
        const sourceNode = neuralNodes[sourceNodeId];
        if (!sourceNode) return;
        
        const links = neuralLinks.filter(l => l.from === sourceNodeId);
        if (links.length === 0) return;
        
        const link = links[Math.floor(Math.random() * links.length)];
        
        let color = "rgba(16, 185, 129, 0.85)"; // Emerald green for inputs
        if (sourceNode.layer >= 1) {
            color = "rgba(168, 85, 247, 0.85)"; // Violet purple for hidden layers
        }
        
        activeSignals.push({
            from: link.from,
            to: link.to,
            progress: 0,
            speed: Math.random() * 0.02 + 0.015,
            color: color
        });
    };

    const animateParticles = () => {
        if (!state.canvasActive || !canvas || !ctx) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Spin rotations
        const mouseFactorX = (state.mouse.x - canvas.width / 2) / (canvas.width / 2);
        const mouseFactorY = (state.mouse.y - canvas.height / 2) / (canvas.height / 2);
        
        const currentRotY = rotY + mouseFactorX * 0.003;
        const currentRotX = rotX + mouseFactorY * 0.003;
        
        const cosY = Math.cos(currentRotY);
        const sinY = Math.sin(currentRotY);
        const cosX = Math.cos(currentRotX);
        const sinX = Math.sin(currentRotX);
        
        // Rotate and project nodes
        neuralNodes.forEach(p => {
            const x1 = p.x * cosY - p.z * sinY;
            const z1 = p.x * sinY + p.z * cosY;
            
            const y2 = p.y * cosX - z1 * sinX;
            const z2 = p.y * sinX + z1 * cosX;
            
            p.x = x1;
            p.y = y2;
            p.z = z2;
            
            const scale = fov / (cameraDistance + z2);
            p.screenX = centerX + x1 * scale;
            p.screenY = centerY + y2 * scale;
            p.scale = scale;
            
            p.glow *= 0.94;
        });
        
        // Spawn signals
        if (Math.random() < 0.08 && activeSignals.length < 24) {
            const inputNodes = neuralNodes.filter(n => n.layer === 0);
            const randomInput = inputNodes[Math.floor(Math.random() * inputNodes.length)];
            spawnSignal(randomInput.id);
        }
        
        // Update signals
        for (let i = activeSignals.length - 1; i >= 0; i--) {
            const sig = activeSignals[i];
            sig.progress += sig.speed;
            
            if (sig.progress >= 1.0) {
                const targetNode = neuralNodes[sig.to];
                if (targetNode) {
                    targetNode.glow = 1.0;
                    
                    if (targetNode.layer < 3) {
                        const cascadeCount = Math.random() < 0.35 ? 2 : 1;
                        for (let c = 0; c < cascadeCount; c++) {
                            spawnSignal(targetNode.id);
                        }
                    }
                }
                activeSignals.splice(i, 1);
            }
        }
        
        // Mouse proximity interaction
        if (state.isLoaded && state.mouse.x > 0) {
            neuralNodes.forEach(n => {
                const dx = state.mouse.x - n.screenX;
                const dy = state.mouse.y - n.screenY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < 50 && n.glow < 0.15) {
                    n.glow = 1.0;
                    if (n.layer < 3) {
                        spawnSignal(n.id);
                        if (Math.random() > 0.5) spawnSignal(n.id);
                    }
                }
            });
        }
        
        // Draw connection links (synapses)
        neuralLinks.forEach(link => {
            const fromNode = neuralNodes[link.from];
            const toNode = neuralNodes[link.to];
            
            if (cameraDistance + fromNode.z <= 0 || cameraDistance + toNode.z <= 0) return;
            
            const alpha = 0.04 + fromNode.glow * 0.16 + toNode.glow * 0.16;
            
            ctx.beginPath();
            ctx.moveTo(fromNode.screenX, fromNode.screenY);
            ctx.lineTo(toNode.screenX, toNode.screenY);
            
            ctx.strokeStyle = fromNode.layer === 0
                ? `rgba(16, 185, 129, ${alpha})` 
                : `rgba(139, 92, 246, ${alpha})`;
                
            ctx.lineWidth = 0.5 + fromNode.glow * 0.6;
            ctx.stroke();
        });
        
        // Draw moving signals (pulses)
        activeSignals.forEach(sig => {
            const fromNode = neuralNodes[sig.from];
            const toNode = neuralNodes[sig.to];
            
            const x = fromNode.x + (toNode.x - fromNode.x) * sig.progress;
            const y = fromNode.y + (toNode.y - fromNode.y) * sig.progress;
            const z = fromNode.z + (toNode.z - fromNode.z) * sig.progress;
            
            const scale = fov / (cameraDistance + z);
            const sx = centerX + x * scale;
            const sy = centerY + y * scale;
            
            ctx.beginPath();
            ctx.arc(sx, sy, Math.max(1.5, scale * 1.8), 0, Math.PI * 2);
            ctx.fillStyle = "#ffffff";
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(sx, sy, Math.max(3, scale * 3.5), 0, Math.PI * 2);
            ctx.fillStyle = sig.color;
            ctx.fill();
        });
        
        // Draw nodes (neurons)
        const depthSortedNodes = [...neuralNodes].sort((a, b) => b.z - a.z);
        
        depthSortedNodes.forEach(n => {
            if (cameraDistance + n.z <= 0) return;
            
            let rgbValues = "16, 185, 129";
            if (n.layer === 1 || n.layer === 2) {
                rgbValues = "139, 92, 246";
            } else if (n.layer === 3) {
                rgbValues = "6, 182, 212";
            }
            
            ctx.beginPath();
            ctx.arc(n.screenX, n.screenY, Math.max(2, n.scale * 2.8), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${rgbValues}, 0.4)`;
            ctx.fill();
            
            if (n.glow > 0.05) {
                ctx.beginPath();
                ctx.arc(n.screenX, n.screenY, Math.max(1, n.scale * 1.8), 0, Math.PI * 2);
                ctx.fillStyle = "#ffffff";
                ctx.fill();
            }
            
            const ringAlpha = Math.max(0.02, n.glow * 0.35);
            ctx.beginPath();
            ctx.arc(n.screenX, n.screenY, Math.max(4, n.scale * (4 + n.glow * 10)), 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(${rgbValues}, ${ringAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
        });
        
        if (state.canvasActive) {
            requestAnimationFrame(animateParticles);
        }
    };

    /* ==========================================================================
       ANIMATED SECTION BACKGROUNDS LIFE-CYCLE MANAGER
       ========================================================================== */
    const activeLoops = {
        home: false,
        about: false,
        skills: false,
        contact: false
    };

    // About Canvas: 3D Rotating Data Globe
    const aboutCanvas = document.getElementById("about-canvas");
    let aboutCtx, aboutPoints = [];
    const sphereRadius = 160;
    let rotationY = 0.002;
    let rotationX = 0.001;

    const initAboutAnim = () => {
        if (!aboutCanvas) return;
        aboutCtx = aboutCanvas.getContext("2d");
        resizeAboutCanvas();
        
        // Generate points distributed on a sphere surface using Fibonacci Spiral
        aboutPoints = [];
        const numPoints = window.innerWidth < 768 ? 60 : 100;
        
        for (let i = 0; i < numPoints; i++) {
            const phi = Math.acos(1 - 2 * (i + 0.5) / numPoints);
            const theta = Math.sqrt(numPoints * Math.PI) * phi;
            
            aboutPoints.push({
                x: sphereRadius * Math.sin(phi) * Math.cos(theta),
                y: sphereRadius * Math.sin(phi) * Math.sin(theta),
                z: sphereRadius * Math.cos(phi)
            });
        }
    };

    const resizeAboutCanvas = () => {
        if (!aboutCanvas) return;
        aboutCanvas.width = aboutCanvas.parentElement.offsetWidth;
        aboutCanvas.height = aboutCanvas.parentElement.offsetHeight;
    };

    const drawAboutAnim = () => {
        if (!activeLoops.about || !aboutCanvas || !aboutCtx) return;
        
        aboutCtx.clearRect(0, 0, aboutCanvas.width, aboutCanvas.height);
        
        const centerX = aboutCanvas.width / 2;
        const centerY = aboutCanvas.height / 2;
        
        // Apply interactive spin adjustments if mouse moves
        const mouseFactorX = (state.mouse.x - window.innerWidth / 2) / (window.innerWidth / 2);
        const mouseFactorY = (state.mouse.y - window.innerHeight / 2) / (window.innerHeight / 2);
        
        const currentRotY = rotationY + mouseFactorX * 0.006;
        const currentRotX = rotationX + mouseFactorY * 0.006;
        
        const cosY = Math.cos(currentRotY);
        const sinY = Math.sin(currentRotY);
        const cosX = Math.cos(currentRotX);
        const sinX = Math.sin(currentRotX);
        
        // Rotate and project points
        const projectedPoints = aboutPoints.map(p => {
            // Rotate Y-axis
            const x1 = p.x * cosY - p.z * sinY;
            const z1 = p.x * sinY + p.z * cosY;
            
            // Rotate X-axis
            const y2 = p.y * cosX - z1 * sinX;
            const z2 = p.y * sinX + z1 * cosX;
            
            // Update the point's position for persistent rotation
            p.x = x1;
            p.y = y2;
            p.z = z2;
            
            // 3D perspective projection
            const distance = 400;
            const fov = 350;
            const scale = fov / (distance + z2);
            
            return {
                x: centerX + x1 * scale,
                y: centerY + y2 * scale,
                z: z2, 
                scale: scale
            };
        });
        
        // Draw links between close points in 3D distance
        for (let i = 0; i < projectedPoints.length; i++) {
            for (let j = i + 1; j < projectedPoints.length; j++) {
                const dx = aboutPoints[i].x - aboutPoints[j].x;
                const dy = aboutPoints[i].y - aboutPoints[j].y;
                const dz = aboutPoints[i].z - aboutPoints[j].z;
                const dist3D = Math.sqrt(dx * dx + dy * dy + dz * dz);
                
                if (dist3D < 65) {
                    const avgZ = (projectedPoints[i].z + projectedPoints[j].z) / 2;
                    const alpha = Math.max(0, (1 - avgZ / sphereRadius) * 0.07); 
                    
                    if (alpha > 0) {
                        aboutCtx.beginPath();
                        aboutCtx.moveTo(projectedPoints[i].x, projectedPoints[i].y);
                        aboutCtx.lineTo(projectedPoints[j].x, projectedPoints[j].y);
                        aboutCtx.strokeStyle = `rgba(16, 185, 129, ${alpha})`; // soft emerald wireframe
                        aboutCtx.lineWidth = 0.5;
                        aboutCtx.stroke();
                    }
                }
            }
        }
        
        // Draw points
        projectedPoints.forEach(p => {
            const alpha = Math.max(0.04, (1 - p.z / sphereRadius) * 0.35);
            const radius = Math.max(0.5, p.scale * 1.3);
            
            aboutCtx.beginPath();
            aboutCtx.arc(p.x, p.y, radius, 0, Math.PI * 2);
            aboutCtx.fillStyle = p.z > 0 
                ? `rgba(99, 102, 241, ${alpha})` // indigo for back nodes
                : `rgba(16, 185, 129, ${alpha * 1.3})`; // bright emerald for front nodes
            aboutCtx.fill();
            
            // Subtle glowing ring around front nodes
            if (p.z < -120) {
                aboutCtx.beginPath();
                aboutCtx.arc(p.x, p.y, radius * 3, 0, Math.PI * 2);
                aboutCtx.strokeStyle = `rgba(16, 185, 129, ${alpha * 0.25})`;
                aboutCtx.lineWidth = 0.5;
                aboutCtx.stroke();
            }
        });
        
        requestAnimationFrame(drawAboutAnim);
    };

    // Skills Canvas: Floating Tech Bubbles Drift
    const skillsCanvas = document.getElementById("skills-canvas");
    let skillsCtx, skillsBubbles = [];
    const skillWords = [
        "Python", "Generative AI", "Machine Learning", "RAG", "LangChain", 
        "Deep Learning", "SQL", "Pandas", "XGBoost", "AWS", "NLP", 
        "LlamaIndex", "Transformers", "Agentic AI", "TensorFlow"
    ];

    const initSkillsAnim = () => {
        if (!skillsCanvas) return;
        skillsCtx = skillsCanvas.getContext("2d");
        resizeSkillsCanvas();
        
        skillsBubbles = [];
        const count = window.innerWidth < 768 ? 10 : 22;
        for (let i = 0; i < count; i++) {
            skillsBubbles.push(createSkillsBubble(true));
        }
    };

    const resizeSkillsCanvas = () => {
        if (!skillsCanvas) return;
        skillsCanvas.width = skillsCanvas.parentElement.offsetWidth;
        skillsCanvas.height = skillsCanvas.parentElement.offsetHeight;
    };

    const createSkillsBubble = (randomY = false) => {
        const word = skillWords[Math.floor(Math.random() * skillWords.length)];
        return {
            x: Math.random() * skillsCanvas.width,
            y: randomY ? Math.random() * skillsCanvas.height : skillsCanvas.height + 50,
            vy: Math.random() * 0.25 + 0.12, // vertical float speed
            radius: Math.random() * 15 + 25, // bubble size
            alpha: 0,
            targetAlpha: Math.random() * 0.07 + 0.03, // faint aesthetic opacity
            fadeSpeed: Math.random() * 0.004 + 0.002,
            word: word,
            scale: Math.random() * 0.4 + 0.6,
            drift: Math.random() * 0.15 - 0.075 // horizontal drift speed
        };
    };

    const drawSkillsAnim = () => {
        if (!activeLoops.skills || !skillsCanvas || !skillsCtx) return;
        
        skillsCtx.clearRect(0, 0, skillsCanvas.width, skillsCanvas.height);
        
        skillsBubbles.forEach((b, index) => {
            b.y -= b.vy;
            b.x += Math.sin(b.y * 0.004) * b.drift;
            
            // Handle soft transitions
            if (b.y < 120) {
                b.alpha -= 0.01;
            } else if (b.alpha < b.targetAlpha) {
                b.alpha += b.fadeSpeed;
            }
            
            // Draw bubble circle
            skillsCtx.beginPath();
            skillsCtx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            skillsCtx.fillStyle = `rgba(139, 92, 246, ${b.alpha * 0.45})`; // faint violet
            skillsCtx.fill();
            
            // Draw skill labels inside bubble
            skillsCtx.fillStyle = `rgba(255, 255, 255, ${b.alpha})`;
            skillsCtx.font = `500 ${10.5 * b.scale}px var(--font-sans)`;
            skillsCtx.textAlign = "center";
            skillsCtx.textBaseline = "middle";
            skillsCtx.fillText(b.word, b.x, b.y);
            
            // Recycle bubble when it floats off or fades
            if (b.y < -50 || b.alpha <= 0) {
                skillsBubbles[index] = createSkillsBubble(false);
            }
        });
        
        requestAnimationFrame(drawSkillsAnim);
    };

    // Contact Canvas: 3D Cognitive Neural Mesh
    const contactCanvas = document.getElementById("contact-canvas");
    let contactCtx;
    let contactNodes = [];
    let contactLinks = [];
    let contactSignals = [];
    const contactFov = 350;
    const contactCamDist = 280;
    let contactRotY = 0.0015;
    let contactRotX = 0.001;

    const initContactAnim = () => {
        if (!contactCanvas) return;
        contactCtx = contactCanvas.getContext("2d");
        resizeContactCanvas();
    };

    const resizeContactCanvas = () => {
        if (!contactCanvas) return;
        contactCanvas.width = contactCanvas.parentElement.offsetWidth;
        contactCanvas.height = contactCanvas.parentElement.offsetHeight;
        buildContactNetwork();
    };

    const buildContactNetwork = () => {
        if (!contactCanvas) return;
        contactNodes = [];
        contactLinks = [];
        contactSignals = [];

        const nodeCount = 45;
        const maxRadius = Math.min(contactCanvas.width, contactCanvas.height) * 0.35;

        for (let i = 0; i < nodeCount; i++) {
            const theta = Math.acos((Math.random() * 2) - 1);
            const phi = Math.random() * Math.PI * 2;
            const r = Math.pow(Math.random(), 0.6) * maxRadius;

            const px = r * Math.sin(theta) * Math.cos(phi);
            const py = r * Math.sin(theta) * Math.sin(phi);
            const pz = r * Math.cos(theta);

            contactNodes.push({
                x: px,
                y: py,
                z: pz,
                baseX: px,
                baseY: py,
                baseZ: pz,
                screenX: 0,
                screenY: 0,
                scale: 1,
                glow: 0
            });
        }

        for (let i = 0; i < nodeCount; i++) {
            for (let j = i + 1; j < nodeCount; j++) {
                const dx = contactNodes[i].x - contactNodes[j].x;
                const dy = contactNodes[i].y - contactNodes[j].y;
                const dz = contactNodes[i].z - contactNodes[j].z;
                const dist3D = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if (dist3D < 120) {
                    contactLinks.push({
                        from: i,
                        to: j
                    });
                }
            }
        }
    };

    const spawnContactSignal = (fromIndex) => {
        const node = contactNodes[fromIndex];
        if (!node) return;

        const connections = contactLinks.filter(l => l.from === fromIndex || l.to === fromIndex);
        if (connections.length === 0) return;

        const conn = connections[Math.floor(Math.random() * connections.length)];
        const toIndex = conn.from === fromIndex ? conn.to : conn.from;

        const isViolet = Math.random() > 0.5;
        const rgbStr = isViolet ? "139, 92, 246" : "16, 185, 129";

        contactSignals.push({
            from: fromIndex,
            to: toIndex,
            progress: 0,
            speed: Math.random() * 0.015 + 0.01,
            rgb: rgbStr
        });
    };

    const drawContactAnim = () => {
        if (!activeLoops.contact || !contactCanvas || !contactCtx) return;

        contactCtx.clearRect(0, 0, contactCanvas.width, contactCanvas.height);

        const centerX = contactCanvas.width / 2;
        const centerY = contactCanvas.height / 2;

        const rect = contactCanvas.getBoundingClientRect();
        const sectionMouseX = state.mouse.x - rect.left;
        const sectionMouseY = state.mouse.y - rect.top;

        const mouseFactorX = (state.mouse.x - window.innerWidth / 2) / (window.innerWidth / 2);
        const mouseFactorY = (state.mouse.y - window.innerHeight / 2) / (window.innerHeight / 2);

        const currentRotY = contactRotY + mouseFactorX * 0.002;
        const currentRotX = contactRotX + mouseFactorY * 0.002;

        const cosY = Math.cos(currentRotY);
        const sinY = Math.sin(currentRotY);
        const cosX = Math.cos(currentRotX);
        const sinX = Math.sin(currentRotX);

        contactNodes.forEach(p => {
            const x1 = p.x * cosY - p.z * sinY;
            const z1 = p.x * sinY + p.z * cosY;

            const y2 = p.y * cosX - z1 * sinX;
            const z2 = p.y * sinX + z1 * cosX;

            p.x = x1;
            p.y = y2;
            p.z = z2;

            const scale = contactFov / (contactCamDist + z2);
            p.screenX = centerX + x1 * scale;
            p.screenY = centerY + y2 * scale;
            p.scale = scale;

            p.glow *= 0.95;
        });

        if (Math.random() < 0.05 && contactSignals.length < 30) {
            const randomNodeIdx = Math.floor(Math.random() * contactNodes.length);
            spawnContactSignal(randomNodeIdx);
        }

        for (let i = contactSignals.length - 1; i >= 0; i--) {
            const sig = contactSignals[i];
            sig.progress += sig.speed;

            if (sig.progress >= 1.0) {
                const targetNode = contactNodes[sig.to];
                if (targetNode) {
                    targetNode.glow = 1.0;
                    if (Math.random() < 0.4) {
                        spawnContactSignal(sig.to);
                    }
                }
                contactSignals.splice(i, 1);
            }
        }

        if (state.isLoaded && state.mouse.x > 0) {
            contactNodes.forEach((n, idx) => {
                const dx = sectionMouseX - n.screenX;
                const dy = sectionMouseY - n.screenY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 70) {
                    if (n.glow < 0.2) {
                        n.glow = 1.0;
                        spawnContactSignal(idx);
                        if (Math.random() > 0.5) {
                            spawnContactSignal(idx);
                        }
                    }
                }
            });
        }

        contactLinks.forEach(link => {
            const fromNode = contactNodes[link.from];
            const toNode = contactNodes[link.to];

            if (contactCamDist + fromNode.z <= 0 || contactCamDist + toNode.z <= 0) return;

            const alpha = 0.05 + fromNode.glow * 0.2 + toNode.glow * 0.2;
            
            contactCtx.beginPath();
            contactCtx.moveTo(fromNode.screenX, fromNode.screenY);
            contactCtx.lineTo(toNode.screenX, toNode.screenY);

            const rgbStr = (link.from + link.to) % 2 === 0 ? "139, 92, 246" : "16, 185, 129";
            contactCtx.strokeStyle = `rgba(${rgbStr}, ${alpha})`;
            contactCtx.lineWidth = 0.5 + fromNode.glow * 0.6;
            contactCtx.stroke();
        });

        contactSignals.forEach(sig => {
            const fromNode = contactNodes[sig.from];
            const toNode = contactNodes[sig.to];

            const x = fromNode.x + (toNode.x - fromNode.x) * sig.progress;
            const y = fromNode.y + (toNode.y - fromNode.y) * sig.progress;
            const z = fromNode.z + (toNode.z - fromNode.z) * sig.progress;

            const scale = contactFov / (contactCamDist + z);
            const sx = centerX + x * scale;
            const sy = centerY + y * scale;

            contactCtx.beginPath();
            contactCtx.arc(sx, sy, Math.max(1.5, scale * 1.8), 0, Math.PI * 2);
            contactCtx.fillStyle = "#ffffff";
            contactCtx.fill();

            contactCtx.beginPath();
            contactCtx.arc(sx, sy, Math.max(3.0, scale * 3.5), 0, Math.PI * 2);
            contactCtx.fillStyle = `rgba(${sig.rgb}, 0.8)`;
            contactCtx.fill();
        });

        const depthSortedNodes = [...contactNodes].sort((a, b) => b.z - a.z);
        depthSortedNodes.forEach(n => {
            if (contactCamDist + n.z <= 0) return;

            const rgbStr = n.z > 0 ? "139, 92, 246" : "16, 185, 129";
            
            const ringAlpha = Math.max(0.03, n.glow * 0.35);
            contactCtx.beginPath();
            contactCtx.arc(n.screenX, n.screenY, Math.max(4, n.scale * (4 + n.glow * 8)), 0, Math.PI * 2);
            contactCtx.strokeStyle = `rgba(${rgbStr}, ${ringAlpha})`;
            contactCtx.lineWidth = 0.8;
            contactCtx.stroke();

            contactCtx.beginPath();
            contactCtx.arc(n.screenX, n.screenY, Math.max(2, n.scale * 2.5), 0, Math.PI * 2);
            contactCtx.fillStyle = `rgba(${rgbStr}, 0.55)`;
            contactCtx.fill();

            if (n.glow > 0.1) {
                contactCtx.beginPath();
                contactCtx.arc(n.screenX, n.screenY, Math.max(1, n.scale * 1.5), 0, Math.PI * 2);
                contactCtx.fillStyle = "#ffffff";
                contactCtx.fill();
            }
        });

        requestAnimationFrame(drawContactAnim);
    };

    // Intersection Observer to manage background canvas lifecycles (saves CPU/GPU performance)
    const sectionAnimObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const sectionId = entry.target.id;
            const isVisible = entry.isIntersecting;
            
            if (sectionId === "home") {
                const wasActive = state.canvasActive;
                state.canvasActive = isVisible && state.isLoaded;
                if (state.canvasActive && !wasActive) {
                    animateParticles();
                }
            } else if (sectionId === "about") {
                const wasInactive = !activeLoops.about;
                activeLoops.about = isVisible;
                if (isVisible && wasInactive) {
                    initAboutAnim();
                    drawAboutAnim();
                }
            } else if (sectionId === "skills") {
                const wasInactive = !activeLoops.skills;
                activeLoops.skills = isVisible;
                if (isVisible && wasInactive) {
                    initSkillsAnim();
                    drawSkillsAnim();
                }
            } else if (sectionId === "contact") {
                const wasInactive = !activeLoops.contact;
                activeLoops.contact = isVisible;
                if (isVisible && wasInactive) {
                    initContactAnim();
                    drawContactAnim();
                }
            }
        });
    }, { threshold: 0.08 }); // trigger early as sections come in

    // Initialize observers once page starts
    const observeSectionBackgrounds = () => {
        const targetIds = ["home", "about", "skills", "contact"];
        targetIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) sectionAnimObserver.observe(el);
        });
    };

    // Call after DOM setup is complete
    observeSectionBackgrounds();

    // Global resize handles for other canvases
    window.addEventListener("resize", () => {
        if (activeLoops.about) resizeAboutCanvas();
        if (activeLoops.skills) resizeSkillsCanvas();
        if (activeLoops.contact) resizeContactCanvas();
    });

    /* ==========================================================================
       IST TIME TRACKER
       ========================================================================== */
    const clockElement = document.getElementById("ist-time");
    
    const updateISTTime = () => {
        const options = {
            timeZone: "Asia/Kolkata",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true
        };
        const formatter = new Intl.DateTimeFormat("en-US", options);
        clockElement.textContent = formatter.format(new Date());
    };
    
    updateISTTime();
    setInterval(updateISTTime, 1000);

    /* ==========================================================================
       TYPEWRITER EFFECT (HERO)
       ========================================================================== */
    const typewriterElement = document.getElementById("typewriter-text");
    const roles = ["Generative AI Specialist", "Machine Learning Trainee", "Data Science Developer"];
    
    let currentRoleIndex = 0;
    let currentCharIndex = 0;
    let isDeleting = false;
    let typingSpeed = 100;

    const runTypewriter = () => {
        const currentRole = roles[currentRoleIndex];
        
        if (isDeleting) {
            typewriterElement.textContent = currentRole.substring(0, currentCharIndex - 1);
            currentCharIndex--;
            typingSpeed = 50; // Deleting speed
        } else {
            typewriterElement.textContent = currentRole.substring(0, currentCharIndex + 1);
            currentCharIndex++;
            typingSpeed = 100; // Normal typing speed
        }

        // Handle logical switch triggers
        if (!isDeleting && currentCharIndex === currentRole.length) {
            isDeleting = true;
            typingSpeed = 2000; // Pause at full string
        } else if (isDeleting && currentCharIndex === 0) {
            isDeleting = false;
            currentRoleIndex = (currentRoleIndex + 1) % roles.length;
            typingSpeed = 500; // Pause before typing next word
        }

        setTimeout(runTypewriter, typingSpeed);
    };

    setTimeout(runTypewriter, 1500);

    /* ==========================================================================
       SKILLS TAB PANEL SWITCHER
       ========================================================================== */
    const tabButtons = document.querySelectorAll(".tab-btn");
    const tabPanels = document.querySelectorAll(".tab-panel");

    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const tabId = btn.getAttribute("data-tab");
            
            // Remove active states from headers
            tabButtons.forEach(b => {
                b.classList.remove("active");
                b.setAttribute("aria-selected", "false");
            });
            
            // Remove active states from panels
            tabPanels.forEach(p => {
                p.classList.remove("active");
            });
            
            // Set current active
            btn.classList.add("active");
            btn.setAttribute("aria-selected", "true");
            
            const targetPanel = document.getElementById(tabId);
            if (targetPanel) {
                targetPanel.classList.add("active");
            }
        });
    });

    /* ==========================================================================
       MOBILE NAVIGATION DRAWER
       ========================================================================== */
    const hamburgerBtn = document.getElementById("hamburger-btn");
    const navMenu = document.getElementById("nav-menu");
    const navLinks = document.querySelectorAll(".nav-link");

    const toggleMenu = () => {
        hamburgerBtn.classList.toggle("open");
        navMenu.classList.toggle("open");
    };

    hamburgerBtn.addEventListener("click", toggleMenu);

    navLinks.forEach(link => {
        link.addEventListener("click", () => {
            if (navMenu.classList.contains("open")) {
                toggleMenu();
            }
        });
    });

    // Close menu when clicking outside navbar
    document.addEventListener("click", (e) => {
        if (!navbar.contains(e.target) && navMenu.classList.contains("open")) {
            toggleMenu();
        }
    });

    /* ==========================================================================
       TIMELINE PROGRESS TRACKER
       ========================================================================== */
    const timelineLine = document.getElementById("timeline-line");
    const timelineItems = document.querySelectorAll(".timeline-item");

    const trackTimelineScroll = () => {
        if (!timelineLine || timelineItems.length === 0) return;
        
        const container = document.querySelector(".timeline-container");
        const containerRect = container.getBoundingClientRect();
        
        const startPoint = containerRect.top + window.scrollY;
        const endPoint = containerRect.bottom + window.scrollY;
        
        // Target scroll point is middle of the screen
        const scrollTarget = window.scrollY + (window.innerHeight * 0.7);
        
        let percentage = ((scrollTarget - startPoint) / (endPoint - startPoint)) * 100;
        percentage = Math.max(0, Math.min(100, percentage));
        
        timelineLine.style.height = `${percentage}%`;

        // Highlight passed timeline cards
        timelineItems.forEach(item => {
            const itemRect = item.getBoundingClientRect();
            const itemMiddle = itemRect.top + window.scrollY + (itemRect.height / 2);
            
            if (scrollTarget > itemMiddle) {
                item.classList.add("passed");
            } else {
                item.classList.remove("passed");
            }
        });
    };

    window.addEventListener("scroll", trackTimelineScroll);
    trackTimelineScroll(); // Run once initially

    /* ==========================================================================
       PROJECT DETAIL MODALS
       ========================================================================== */
    const projectDatabase = {
        "project-ollama": {
            title: "Ollama AI Student Support Chatbot",
            tag: "Generative AI / RAG Architecture",
            image: "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=800",
            excerpt: "Engineered a low-latency, fully localized LLM-powered chatbot specifically optimized to provide real-time psychological and stress support mechanisms for students.",
            bullets: [
                "**Local Inference Optimization**: Hosted and integrated Ollama models locally, avoiding latency and dependency on third-party remote APIs.",
                "**Multi-modal Speech Pipelines**: Engineered responsive text-to-speech and speech-to-text systems via SpeechRecognition and pyttsx3/gTTS libraries, allowing interactive hands-free operations.",
                "**NLP Preprocessing**: Streamlined raw inputs through Lemmatization and tokenization cleaning pipelines to ensure high contextual consistency.",
                "**Contextual Prompt Engineering**: Implemented strict semantic directives restricting responses to student therapy bounds, including immediate escalation recommendations for critical indicators."
            ],
            tech: ["Python", "Ollama Local LLMs", "Natural Language Processing (NLP)", "SpeechRecognition", "pyttsx3", "gTTS", "Pandas"],
            github: "https://github.com/Swethanjali151"
        },
        "project-instability": {
            title: "Detection of Psychological Instability using Machine Learning",
            tag: "Machine Learning / NLP Classifiers",
            image: "https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=800",
            excerpt: "Developed robust statistical classification engines capable of identifying mental health risk indicators based on high-dimensional behavioral datasets.",
            bullets: [
                "**Model Benchmark Matrix**: Integrated, tuned, and compared a series of classification architectures including Logistic Regression, Support Vector Machines (SVM), Decision Trees, K-Nearest Neighbors (KNN), and XGBoost.",
                "**Rigorous Pipeline Preprocessing**: Created automated standard scaling, category encoding, and null imputation components using Scikit-Learn pipelines.",
                "**Over-fitting Elimination**: Conducted Stratified K-Fold cross-validation, hyperparameter tuning via Grid Search, and checked ROC-AUC curves to achieve a highly generalized high-accuracy output.",
                "**Data Exploration**: Conducted deep correlation analysis, data profiling, and statistical visualization utilizing Matplotlib and Seaborn."
            ],
            tech: ["Python", "Pandas", "NumPy", "Scikit-Learn", "XGBoost", "Machine Learning Classifiers", "Matplotlib", "Seaborn"],
            github: "https://github.com/Swethanjali151/Detection-OF-Psychological-Instability-Project-using-Machine-Learning.git"
        }
    };

    const modalOverlay = document.getElementById("project-modal");
    const modalBodyContent = document.getElementById("modal-body-content");
    const modalCloseBtn = document.getElementById("modal-close");
    const projectCards = document.querySelectorAll(".project-card");

    const openModal = (projectId) => {
        const data = projectDatabase[projectId];
        if (!data) return;

        // Build bullets list HTML
        const bulletsHtml = data.bullets
            .map(b => {
                // simple markdown bold replacement
                const formatted = b.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                return `<li>${formatted}</li>`;
            })
            .join("");

        // Build tech badges HTML
        const techHtml = data.tech
            .map(t => `<span>${t}</span>`)
            .join("");

        modalBodyContent.innerHTML = `
            <img class="modal-hero-img" src="${data.image}" alt="${data.title}">
            <div class="modal-details-content">
                <span class="modal-project-tag">${data.tag}</span>
                <h2 class="modal-project-title">${data.title}</h2>
                
                <h3 class="modal-subtitle">Project Overview</h3>
                <p class="about-text" style="margin-bottom: 25px;">${data.excerpt}</p>
                
                <h3 class="modal-subtitle">Key Implementation Milestones</h3>
                <ul class="modal-desc-bullets">
                    ${bulletsHtml}
                </ul>
                
                <div class="modal-tech-section">
                    <h3 class="modal-subtitle">Technologies Utilized</h3>
                    <div class="project-card-tech" style="margin-bottom: 0;">
                        ${techHtml}
                    </div>
                </div>
                
                <div class="project-card-links" style="margin-top: 30px; border-top: 1px solid var(--border-glass); padding-top: 20px;">
                    <a href="${data.github}" target="_blank" rel="noopener noreferrer" class="primary-btn">
                        <i data-lucide="github"></i>
                        <span>View Source Code</span>
                    </a>
                </div>
            </div>
        `;
        
        // Re-trigger Lucide Icons inside modal
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Fade in modal
        modalOverlay.classList.add("open");
        document.body.style.overflow = "hidden"; // disable scroll
    };

    const closeModal = () => {
        modalOverlay.classList.remove("open");
        document.body.style.overflow = ""; // restore scroll
    };

    projectCards.forEach(card => {
        card.addEventListener("click", (e) => {
            const projectId = card.getAttribute("data-project-id");
            // Only trigger if we didn't click direct external links (e.g. direct github icon)
            if (!e.target.closest(".card-action-icon")) {
                openModal(projectId);
            }
        });
    });

    modalCloseBtn.addEventListener("click", closeModal);
    modalOverlay.addEventListener("click", (e) => {
        if (e.target === modalOverlay) {
            closeModal();
        }
    });

    // Close on escape key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modalOverlay.classList.contains("open")) {
            closeModal();
        }
    });

    /* ==========================================================================
       CONTACT FORM VALIDATION & SUBMISSION
       ========================================================================== */
    const contactForm = document.getElementById("contact-form");
    const successOverlay = document.getElementById("form-success");
    const resetFormBtn = document.getElementById("reset-form-btn");
    
    // Select form inputs
    const nameInput = document.getElementById("form-name");
    const emailInput = document.getElementById("form-email");
    const subjectInput = document.getElementById("form-subject");
    const messageInput = document.getElementById("form-message");

    const validateInput = (input, errorId) => {
        const group = input.parentElement;
        let isValid = true;

        if (input.required && input.value.trim() === "") {
            isValid = false;
        }

        // Email regex verification
        if (isValid && input.type === "email") {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(input.value.trim())) {
                isValid = false;
            }
        }

        if (!isValid) {
            group.classList.add("invalid");
        } else {
            group.classList.remove("invalid");
        }

        return isValid;
    };

    // Remove invalid triggers on typing
    const inputs = [nameInput, emailInput, subjectInput, messageInput];
    inputs.forEach(input => {
        input.addEventListener("input", () => {
            if (input.value.trim() !== "") {
                input.parentElement.classList.remove("invalid");
            }
        });
    });

    contactForm.addEventListener("submit", (e) => {
        e.preventDefault();

        // Validate all fields
        let isFormValid = true;
        isFormValid &= validateInput(nameInput, "name-error");
        isFormValid &= validateInput(emailInput, "email-error");
        isFormValid &= validateInput(subjectInput, "subject-error");
        isFormValid &= validateInput(messageInput, "message-error");

        if (isFormValid) {
            const submitBtn = document.getElementById("submit-btn");
            const staticText = submitBtn.querySelector(".btn-static");
            const loaderText = submitBtn.querySelector(".btn-loader");

            // Show loader, disable buttons
            staticText.style.display = "none";
            loaderText.style.display = "flex";
            submitBtn.disabled = true;

            // Simulate server POST call
            setTimeout(() => {
                // Reset submit state
                staticText.style.display = "block";
                loaderText.style.display = "none";
                submitBtn.disabled = false;

                // Show Success Screen
                successOverlay.classList.add("show");
            }, 1800);
        }
    });

    resetFormBtn.addEventListener("click", () => {
        contactForm.reset();
        successOverlay.classList.remove("show");
    });

    /* ==========================================================================
       SCROLL-TRIGGERED ACTIVE LINKS & NAVBAR COLOR
       ========================================================================== */
    const sections = document.querySelectorAll("section");

    const handleScrollActiveLink = () => {
        const scrollPosition = window.scrollY + 120;

        sections.forEach(sec => {
            const top = sec.offsetTop;
            const height = sec.offsetHeight;
            const id = sec.getAttribute("id");

            if (scrollPosition >= top && scrollPosition < top + height) {
                navLinks.forEach(link => {
                    link.classList.remove("active");
                    if (link.getAttribute("href") === `#${id}`) {
                        link.classList.add("active");
                    }
                });
            }
        });

        // Add blur style offset when scrolled
        if (window.scrollY > 50) {
            navbar.style.borderBottom = "1px solid rgba(99, 102, 241, 0.2)";
            navbar.style.boxShadow = "0 10px 40px rgba(0, 0, 0, 0.6)";
        } else {
            navbar.style.borderBottom = "1px solid var(--border-glass)";
            navbar.style.boxShadow = "0 10px 40px var(--shadow-glass)";
        }
    };

    window.addEventListener("scroll", handleScrollActiveLink);
    handleScrollActiveLink(); // Initial check

    // Set Footer Copyright Year
    const yearElement = document.getElementById("current-year");
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
});

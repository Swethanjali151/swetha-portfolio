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
    const interactiveElements = document.querySelectorAll("a, button, .project-stack-card, .tab-btn, #hamburger-btn, .reset-form-btn");
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
       PROJECTS 3D STACK & DYNAMIC EXPLOSION
       ========================================================================== */
    const stackContainer = document.getElementById("projects-stack-container");
    const stackCards = Array.from(document.querySelectorAll(".project-stack-card"));
    const prevBtn = document.getElementById("stack-prev-btn");
    const nextBtn = document.getElementById("stack-next-btn");
    const dotsContainer = document.getElementById("stack-dots-container");
    const explosionCanvas = document.getElementById("project-explosion-canvas");
    
    // Setup Stack Dot Indicators dynamically
    dotsContainer.innerHTML = "";
    stackCards.forEach((_, index) => {
        const dot = document.createElement("span");
        dot.classList.add("stack-dot");
        if (index === 0) dot.classList.add("active");
        dot.setAttribute("data-index", index);
        dotsContainer.appendChild(dot);
    });
    
    const stackDots = Array.from(dotsContainer.querySelectorAll(".stack-dot"));
    
    let currentStackIndex = 0;
    let isExploded = false;
    let activeExplodedCard = null;
    
    const updateStack = () => {
        const totalCards = stackCards.length;
        
        stackCards.forEach((card, index) => {
            let relIndex = (index - currentStackIndex + totalCards) % totalCards;
            
            if (relIndex === 0) {
                card.setAttribute("data-status", "active");
            } else if (relIndex === 1) {
                card.setAttribute("data-status", "behind-1");
            } else if (relIndex === 2) {
                card.setAttribute("data-status", "behind-2");
            } else if (relIndex === 3) {
                card.setAttribute("data-status", "behind-3");
            } else {
                card.setAttribute("data-status", "hidden");
            }
        });
        
        // Update dots
        stackDots.forEach((dot, index) => {
            if (index === currentStackIndex) {
                dot.classList.add("active");
            } else {
                dot.classList.remove("active");
            }
        });
    };
    
    // Initial call to set up stack positions
    updateStack();
    
    // Cycle Stack Handlers
    const cycleNext = () => {
        if (isExploded) return;
        currentStackIndex = (currentStackIndex + 1) % stackCards.length;
        updateStack();
    };
    
    const cyclePrev = () => {
        if (isExploded) return;
        currentStackIndex = (currentStackIndex - 1 + stackCards.length) % stackCards.length;
        updateStack();
    };
    
    if (nextBtn) nextBtn.addEventListener("click", cycleNext);
    if (prevBtn) prevBtn.addEventListener("click", cyclePrev);
    
    stackDots.forEach(dot => {
        dot.addEventListener("click", () => {
            if (isExploded) return;
            currentStackIndex = parseInt(dot.getAttribute("data-index"));
            updateStack();
        });
    });
    
    // Particle Explosion System
    let expCtx = null;
    let expParticles = [];
    let expAnimationId = null;
    
    const initExplosionCanvas = () => {
        if (!explosionCanvas) return;
        expCtx = explosionCanvas.getContext("2d");
        explosionCanvas.width = window.innerWidth;
        explosionCanvas.height = window.innerHeight;
    };
    
    window.addEventListener("resize", () => {
        if (explosionCanvas && explosionCanvas.style.display === "block") {
            explosionCanvas.width = window.innerWidth;
            explosionCanvas.height = window.innerHeight;
        }
    });
    
    class ExplosionParticle {
        constructor(x, y, color, isButterfly = false) {
            this.x = x;
            this.y = y;
            this.size = Math.random() * 5 + 3; // slightly larger for butterflies
            const angle = Math.random() * Math.PI * 2;
            const speed = isButterfly ? (Math.random() * 8 + 4) : (Math.random() * 12 + 6); // slightly slower drift
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.gravity = 0.08;
            this.friction = isButterfly ? 0.96 : 0.95; // floats longer
            this.alpha = 1;
            this.decay = isButterfly ? (Math.random() * 0.015 + 0.008) : (Math.random() * 0.02 + 0.012); // decays slower
            this.color = color;
            this.isButterfly = isButterfly;
            this.wingOffset = Math.random() * 100;
        }
        
        update() {
            this.vx *= this.friction;
            this.vy *= this.friction;
            
            if (this.isButterfly) {
                // Sinuous flight path (drift left/right and flutter up/down)
                this.vx += Math.sin(Date.now() * 0.02 + this.wingOffset) * 0.15;
                this.vy += (Math.random() - 0.45) * 0.15; // light float
            } else {
                this.vy += this.gravity;
            }
            
            this.x += this.vx;
            this.y += this.vy;
            this.alpha -= this.decay;
        }
        
        draw(ctx) {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.shadowBlur = 12;
            ctx.shadowColor = this.color;
            
            if (this.isButterfly) {
                ctx.translate(this.x, this.y);
                const angle = Math.atan2(this.vy, this.vx);
                ctx.rotate(angle);
                
                // Wing flapping animation
                const wingScale = Math.abs(Math.sin(Date.now() * 0.015 + this.wingOffset));
                
                ctx.fillStyle = this.color;
                ctx.beginPath();
                // Left Wing
                ctx.moveTo(0, 0);
                ctx.bezierCurveTo(-this.size * 1.5 * wingScale, -this.size * 2, -this.size * 2 * wingScale, -this.size, 0, 0);
                ctx.bezierCurveTo(-this.size * wingScale, this.size, -this.size * 1.5 * wingScale, this.size * 2, 0, 0);
                
                // Right Wing
                ctx.moveTo(0, 0);
                ctx.bezierCurveTo(this.size * 1.5 * wingScale, -this.size * 2, this.size * 2 * wingScale, -this.size, 0, 0);
                ctx.bezierCurveTo(this.size * wingScale, this.size, this.size * 1.5 * wingScale, this.size * 2, 0, 0);
                ctx.fill();
                
                // Tiny body/antennae
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(0, -this.size / 2);
                ctx.lineTo(-this.size / 2, -this.size * 1.2);
                ctx.moveTo(0, -this.size / 2);
                ctx.lineTo(this.size / 2, -this.size * 1.2);
                ctx.stroke();
            } else {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
            }
            ctx.restore();
        }
    }
    
    const animateExplosion = () => {
        if (!expCtx || expParticles.length === 0) {
            if (explosionCanvas) explosionCanvas.style.display = "none";
            cancelAnimationFrame(expAnimationId);
            return;
        }
        
        expCtx.clearRect(0, 0, explosionCanvas.width, explosionCanvas.height);
        
        for (let i = expParticles.length - 1; i >= 0; i--) {
            const p = expParticles[i];
            p.update();
            p.draw(expCtx);
            
            if (p.alpha <= 0) {
                expParticles.splice(i, 1);
            }
        }
        
        expAnimationId = requestAnimationFrame(animateExplosion);
    };
    
    const triggerExplosion = (x, y, projectId) => {
        initExplosionCanvas();
        if (!explosionCanvas || !expCtx) return;
        
        explosionCanvas.style.display = "block";
        expParticles = [];
        
        // Color palettes matching project themes
        let colors = ["#6366f1", "#a855f7", "#ffffff"]; // default Indigo/Violet
        if (projectId === "project-ollama") {
            colors = ["#10b981", "#34d399", "#ffffff", "#6366f1"]; // Emerald & Indigo
        } else if (projectId === "project-instability") {
            colors = ["#a855f7", "#ec4899", "#ffffff", "#3b82f6"]; // Violet & Pink & Blue
        } else if (projectId === "project-chatbot") {
            colors = ["#10b981", "#34d399", "#f59e0b", "#a855f7", "#ffffff"]; // Emerald & Mint & Gold & Violet & White
        } else if (projectId === "project-eda-insights") {
            colors = ["#06b6d4", "#10b981", "#ffffff", "#14b8a6"]; // Cyan & Emerald & Teal
        }
        
        const particleCount = window.innerWidth < 768 ? 60 : 120;
        const isButterfly = projectId === "project-chatbot";
        for (let i = 0; i < particleCount; i++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            expParticles.push(new ExplosionParticle(x, y, color, isButterfly));
        }
        
        cancelAnimationFrame(expAnimationId);
        expAnimationId = requestAnimationFrame(animateExplosion);
    };
    
    // FLIP Expansion Animation
    const explodeCard = (card) => {
        if (isExploded) return;
        
        const projectId = card.getAttribute("data-project-id");
        
        // 1. Particle Explosion at Card Center
        const rect = card.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        triggerExplosion(centerX, centerY, projectId);
        
        // 2. FLIP: First (Get starting layout rect)
        const first = card.getBoundingClientRect();
        
        // 3. FLIP: Last (Apply class to trigger final styles)
        card.classList.add("exploded");
        activeExplodedCard = card;
        
        // Disable 3D perspective on parents so fixed positioning works relative to viewport
        if (stackContainer) {
            stackContainer.classList.add("stack-exploded");
            const wrapper = stackContainer.closest(".projects-stack-wrapper");
            if (wrapper) wrapper.classList.add("stack-exploded");
        }
        
        // Scatter other cards and hide controls
        stackCards.forEach(c => {
            if (c !== card) c.classList.add("scattered");
        });
        const controls = document.querySelector(".stack-controls");
        if (controls) controls.classList.add("hidden");
        document.body.style.overflow = "hidden"; // Disable scroll
        
        const last = card.getBoundingClientRect();
        
        // 4. FLIP: Invert (Calculate diffs and apply inverse transform immediately)
        const invertX = (first.left + first.width / 2) - (last.left + last.width / 2);
        const invertY = (first.top + first.height / 2) - (last.top + last.height / 2);
        const scaleX = first.width / last.width;
        const scaleY = first.height / last.height;
        
        card.style.transform = `translate(calc(-50% + ${invertX}px), calc(-50% + ${invertY}px)) scale(${scaleX}, ${scaleY})`;
        card.style.transition = "none";
        
        // Force reflow to register the invert state
        card.offsetHeight;
        
        // 5. FLIP: Play (Remove inverse transform to animate smoothly to center)
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                card.style.transition = "transform 0.7s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.7s ease, border-color 0.7s ease, background-color 0.4s ease";
                card.style.transform = "translate(-50%, -50%) scale(1)";
                isExploded = true;
            });
        });
    };
    
    // FLIP Collapse Animation
    const collapseCard = (card) => {
        if (!isExploded) return;
        
        // 1. FLIP: First (Get current large rect)
        const first = card.getBoundingClientRect();
        
        // 2. FLIP: Last (Remove class to restore stacked styles)
        card.classList.remove("exploded");
        activeExplodedCard = null;
        
        // Restore 3D perspective on parents
        if (stackContainer) {
            stackContainer.classList.remove("stack-exploded");
            const wrapper = stackContainer.closest(".projects-stack-wrapper");
            if (wrapper) wrapper.classList.remove("stack-exploded");
        }
        
        // Gather other cards back and show controls
        stackCards.forEach(c => {
            c.classList.remove("scattered");
        });
        const controls = document.querySelector(".stack-controls");
        if (controls) controls.classList.remove("hidden");
        document.body.style.overflow = ""; // Restore scroll
        
        const last = card.getBoundingClientRect();
        
        // 3. FLIP: Invert
        const invertX = (first.left + first.width / 2) - (last.left + last.width / 2);
        const invertY = (first.top + first.height / 2) - (last.top + last.height / 2);
        const scaleX = first.width / last.width;
        const scaleY = first.height / last.height;
        
        // Set starting state for collapse animation
        card.style.transition = "none";
        card.style.transform = `translate(${invertX}px, ${invertY}px) scale(${scaleX}, ${scaleY})`;
        
        card.offsetHeight; // Force reflow
        
        // 4. FLIP: Play (Animate back to stacked position)
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                card.style.transition = "transform 0.7s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.7s ease, border-color 0.7s ease, background-color 0.4s ease";
                card.style.transform = "translate3d(0, 0, 0) scale(1)";
                
                // Clear inline styles once animation completes
                setTimeout(() => {
                    card.style.transform = "";
                    card.style.transition = "";
                    isExploded = false;
                }, 700);
            });
        });
    };
    
    // Card Event Listeners
    stackCards.forEach(card => {
        card.addEventListener("click", (e) => {
            // Check if we clicked the close button
            if (e.target.closest(".close-exploded-btn")) {
                e.stopPropagation();
                collapseCard(card);
                return;
            }
            
            // Avoid triggering actions if clicking external links (e.g., github icon)
            if (e.target.closest(".card-action-icon")) {
                return;
            }
            
            const isReadDetailsClick = e.target.closest(".card-action-btn.primary-action") || e.target.closest(".primary-action");
            const status = card.getAttribute("data-status");
            
            if (status === "active" || isReadDetailsClick) {
                // If it's active or they clicked "Read Details" directly, make sure it's active and explode it!
                if (status !== "active") {
                    const index = stackCards.indexOf(card);
                    currentStackIndex = index;
                    updateStack();
                }
                explodeCard(card);
            } else {
                // If it's behind and they clicked elsewhere on the card, just bring it to the front
                const index = stackCards.indexOf(card);
                currentStackIndex = index;
                updateStack();
            }
        });
    });
    
    // Exploded View Navigation Mechanics
    let isTransitioning = false;
    
    const cycleExploded = (direction) => {
        if (!isExploded || !activeExplodedCard || isTransitioning) return;
        isTransitioning = true;
        
        const currentCard = activeExplodedCard;
        const totalCards = stackCards.length;
        
        let newIndex;
        if (direction === "next") {
            newIndex = (currentStackIndex + 1) % totalCards;
        } else {
            newIndex = (currentStackIndex - 1 + totalCards) % totalCards;
        }
        
        const nextCard = stackCards[newIndex];
        
        // 1. Fade out & slide current card
        currentCard.style.transition = "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease";
        if (direction === "next") {
            currentCard.style.transform = "translate(-120%, -50%) scale(0.9)";
        } else {
            currentCard.style.transform = "translate(20%, -50%) scale(0.9)";
        }
        currentCard.style.opacity = "0";
        
        setTimeout(() => {
            // Reset current card
            currentCard.classList.remove("exploded");
            currentCard.classList.add("scattered");
            currentCard.style.transform = "";
            currentCard.style.transition = "";
            currentCard.style.opacity = "";
            
            // Update stack index
            currentStackIndex = newIndex;
            updateStack();
            
            // Setup next card
            nextCard.classList.remove("scattered");
            nextCard.classList.add("exploded");
            activeExplodedCard = nextCard;
            
            // Trigger lucide icon replacement if any new items loaded
            if (typeof lucide !== "undefined") {
                lucide.createIcons();
            }
            
            nextCard.style.transition = "none";
            if (direction === "next") {
                nextCard.style.transform = "translate(20%, -50%) scale(0.9)";
            } else {
                nextCard.style.transform = "translate(-120%, -50%) scale(0.9)";
            }
            nextCard.style.opacity = "0";
            
            nextCard.offsetHeight; // force reflow
            
            // Slide next card in
            requestAnimationFrame(() => {
                nextCard.style.transition = "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s ease";
                nextCard.style.transform = "translate(-50%, -50%) scale(1)";
                nextCard.style.opacity = "1";
                
                setTimeout(() => {
                    isTransitioning = false;
                }, 500);
            });
        }, 400);
    };
    
    // Bind Exploded Floating Buttons
    const explodedPrevBtn = document.getElementById("exploded-prev-btn");
    const explodedNextBtn = document.getElementById("exploded-next-btn");
    if (explodedPrevBtn) {
        explodedPrevBtn.addEventListener("click", () => cycleExploded("prev"));
    }
    if (explodedNextBtn) {
        explodedNextBtn.addEventListener("click", () => cycleExploded("next"));
    }
    
    // Keyboard Navigation when Exploded
    document.addEventListener("keydown", (e) => {
        if (isExploded && activeExplodedCard) {
            if (e.key === "Escape") {
                collapseCard(activeExplodedCard);
            } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
                cycleExploded("next");
            } else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
                cycleExploded("prev");
            }
        }
    });

    // Swipe gestures for mobile when exploded
    let touchStartX = 0;
    let touchEndX = 0;
    
    document.addEventListener("touchstart", (e) => {
        if (!isExploded) return;
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    document.addEventListener("touchend", (e) => {
        if (!isExploded) return;
        touchEndX = e.changedTouches[0].screenX;
        
        const threshold = 55;
        if (touchEndX < touchStartX - threshold) {
            cycleExploded("next");
        } else if (touchEndX > touchStartX + threshold) {
            cycleExploded("prev");
        }
    }, { passive: true });

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

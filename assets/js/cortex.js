(() => {
  "use strict";

  const storage = {
    get(key) {
      try { return window.localStorage.getItem(key); } catch (_) { return null; }
    }
  };

  const session = {
    get(key) {
      try { return window.sessionStorage.getItem(key); } catch (_) { return null; }
    },
    set(key, value) {
      try { window.sessionStorage.setItem(key, value); } catch (_) { /* Storage may be disabled. */ }
    },
    remove(key) {
      try { window.sessionStorage.removeItem(key); } catch (_) { /* Storage may be disabled. */ }
    }
  };

  const LAYERS = [
    { code: "L1", name: "Molecular", density: 22, morphology: "horizontal", color: "#8debd0", lightColor: "#187767", scale: 0.72, fibers: 12 },
    { code: "L2", name: "External granular", density: 46, morphology: "stellate", color: "#68d8cf", lightColor: "#087d78", scale: 0.72, fibers: 5 },
    { code: "L3", name: "External pyramidal", density: 35, morphology: "pyramidal", color: "#70b8f0", lightColor: "#236da6", scale: 0.92, fibers: 5 },
    { code: "L4", name: "Internal granular", density: 54, morphology: "stellate", color: "#9a91ef", lightColor: "#5b4eaa", scale: 0.66, fibers: 7 },
    { code: "L5", name: "Internal pyramidal", density: 25, morphology: "pyramidal", color: "#d18ce5", lightColor: "#874b98", scale: 1.38, fibers: 4 },
    { code: "L6", name: "Multiform", density: 34, morphology: "mixed", color: "#ef9da9", lightColor: "#a34d5d", scale: 1.0, fibers: 6 }
  ];

  class CortexBackground {
    constructor() {
      this.canvas = document.createElement("canvas");
      this.canvas.id = "cortex-canvas";
      this.canvas.setAttribute("aria-hidden", "true");
      document.body.prepend(this.canvas);
      this.ctx = this.canvas.getContext("2d", { alpha: true });
      this.width = 0;
      this.height = 0;
      this.dpr = 1;
      this.depth = 0;
      this.targetDepth = 0;
      this.neurons = [];
      this.fibers = [];
      this.pulses = [];
      this.lastTime = performance.now();
      this.nextRandomSpike = this.lastTime + 500;
      this.frameRequest = 0;
      this.visible = !document.hidden;
      this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      this.motionMode = storage.get("neurofolio-motion") === "calm" ? "calm" : "active";
      this.seed = this.hash(`${window.location.pathname}:${window.innerWidth}`);
      this.random = this.seededRandom(this.seed);
      this.palette = this.readPalette();
      this.resizeObserver = null;
      this.handleResize = this.handleResize.bind(this);
      this.handlePointer = this.handlePointer.bind(this);
      this.animate = this.animate.bind(this);
      this.handleVisibility = this.handleVisibility.bind(this);
      this.init();
    }

    init() {
      this.resize();
      this.generateScene();
      this.computeDepth();

      window.addEventListener("resize", this.handleResize, { passive: true });
      window.addEventListener("pointerdown", this.handlePointer, { passive: true, capture: true });
      document.addEventListener("visibilitychange", this.handleVisibility);
      window.addEventListener("neurofolio:depth", (event) => {
        this.targetDepth = Number(event.detail?.depth || 0);
        if (this.reducedMotion || this.motionMode === "calm") {
          this.depth = this.targetDepth;
          this.draw(performance.now(), 0);
        }
      });
      window.addEventListener("neurofolio:burst", (event) => {
        const detail = event.detail || {};
        this.burst(detail.x ?? this.width / 2, detail.y ?? this.height / 2, detail.intensity ?? 1);
      });
      window.addEventListener("neurofolio:themechange", () => {
        this.palette = this.readPalette();
        this.draw(performance.now(), 0);
      });
      window.addEventListener("neurofolio:motionchange", (event) => {
        this.setMotionMode(event.detail?.mode);
      });

      if (this.reducedMotion || this.motionMode === "calm") {
        this.draw(performance.now(), 0);
      } else {
        this.frameRequest = requestAnimationFrame(this.animate);
      }

      const pending = session.get("neurofolio-pending-burst");
      if (pending) {
        session.remove("neurofolio-pending-burst");
        window.setTimeout(() => this.burst(this.width * 0.5, this.height * 0.42, 1.4), 180);
      }
    }

    hash(input) {
      let result = 2166136261;
      for (let index = 0; index < input.length; index += 1) {
        result ^= input.charCodeAt(index);
        result = Math.imul(result, 16777619);
      }
      return result >>> 0;
    }

    seededRandom(seed) {
      let state = seed || 1;
      return () => {
        state += 0x6d2b79f5;
        let value = state;
        value = Math.imul(value ^ (value >>> 15), value | 1);
        value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
      };
    }

    readPalette() {
      const style = getComputedStyle(document.documentElement);
      return {
        text: style.getPropertyValue("--text").trim() || "#e7f4ef",
        line: style.getPropertyValue("--line-strong").trim() || "rgba(191, 241, 222, .34)",
        accent: style.getPropertyValue("--accent").trim() || "#79f2c0",
        background: style.getPropertyValue("--bg").trim() || "#071013",
        light: document.documentElement.dataset.theme === "light"
      };
    }

    handleResize() {
      window.clearTimeout(this.resizeTimer);
      this.resizeTimer = window.setTimeout(() => {
        this.resize();
        this.seed = this.hash(`${window.location.pathname}:${Math.round(window.innerWidth / 120)}`);
        this.random = this.seededRandom(this.seed);
        this.generateScene();
        this.draw(performance.now(), 0);
      }, 90);
    }

    resize() {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.dpr = Math.min(window.devicePixelRatio || 1, this.width < 800 ? 1.35 : 1.65);
      this.canvas.width = Math.max(1, Math.floor(this.width * this.dpr));
      this.canvas.height = Math.max(1, Math.floor(this.height * this.dpr));
      this.canvas.style.width = `${this.width}px`;
      this.canvas.style.height = `${this.height}px`;
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }

    generateScene() {
      this.neurons = LAYERS.map((layer, layerIndex) => {
        const widthFactor = Math.max(0.68, Math.min(1.18, this.width / 1360));
        const count = Math.max(12, Math.round(layer.density * widthFactor));
        return Array.from({ length: count }, (_, neuronIndex) => {
          const morphology = layer.morphology === "mixed"
            ? ["stellate", "pyramidal", "fusiform"][Math.floor(this.random() * 3)]
            : layer.morphology;
          return {
            id: `${layerIndex}-${neuronIndex}`,
            layer: layerIndex,
            x: 0.03 + this.random() * 0.94,
            y: 0.06 + this.random() * 0.88,
            size: (5.5 + this.random() * 8.5) * layer.scale,
            rotation: (this.random() - 0.5) * (morphology === "horizontal" ? 0.4 : 0.22),
            phase: this.random() * Math.PI * 2,
            drift: 0.4 + this.random() * 0.8,
            morphology,
            spike: 0,
            fireAt: 0,
            screenX: 0,
            screenY: 0,
            branch: Math.floor(this.random() * 100000)
          };
        });
      });

      this.fibers = LAYERS.map((layer, layerIndex) => Array.from({ length: layer.fibers }, (_, fiberIndex) => ({
        layer: layerIndex,
        y: 0.08 + (fiberIndex / Math.max(1, layer.fibers - 1)) * 0.84 + (this.random() - 0.5) * 0.05,
        amplitude: 12 + this.random() * 34,
        phase: this.random() * Math.PI * 2,
        frequency: 0.7 + this.random() * 1.5,
        vertical: layerIndex > 1 && this.random() > 0.62
      })));
    }

    computeDepth() {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      this.targetDepth = Math.min(5, Math.max(0, (window.scrollY / max) * 5));
      this.depth = this.targetDepth;
    }

    handleVisibility() {
      this.visible = !document.hidden;
      if (this.visible && !this.reducedMotion && this.motionMode === "active" && !this.frameRequest) {
        this.lastTime = performance.now();
        this.frameRequest = requestAnimationFrame(this.animate);
      } else if (!this.visible && this.frameRequest) {
        cancelAnimationFrame(this.frameRequest);
        this.frameRequest = 0;
      }
    }

    handlePointer(event) {
      if (event.button !== undefined && event.button !== 0) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest(".nav-actions") || this.motionMode === "calm") return;
      const anchor = target?.closest("a[href]");
      if (anchor) {
        try {
          const destination = new URL(anchor.href, window.location.href);
          if (destination.origin === window.location.origin && destination.href !== window.location.href) {
            session.set("neurofolio-pending-burst", "1");
          }
        } catch (_) {
          // Ignore malformed links.
        }
      }
      this.burst(event.clientX, event.clientY, target?.closest("button, a") ? 1.18 : 1);
    }

    setMotionMode(mode) {
      const next = mode === "calm" ? "calm" : "active";
      if (next === this.motionMode && (next === "calm" || this.frameRequest)) return;
      this.motionMode = next;

      if (next === "calm" || this.reducedMotion) {
        if (this.frameRequest) cancelAnimationFrame(this.frameRequest);
        this.frameRequest = 0;
        this.pulses = [];
        this.neurons.flat().forEach((neuron) => {
          neuron.fireAt = 0;
          neuron.spike = 0;
        });
        this.depth = this.targetDepth;
        this.draw(performance.now(), 0);
        return;
      }

      this.lastTime = performance.now();
      this.nextRandomSpike = this.lastTime + 240;
      if (this.visible && !this.frameRequest) this.frameRequest = requestAnimationFrame(this.animate);
    }

    visibleNeurons() {
      return this.neurons.flat().filter((neuron) => {
        const layerDistance = Math.abs(neuron.layer - this.depth);
        return layerDistance < 1.65 && neuron.screenY > -100 && neuron.screenY < this.height + 100;
      });
    }

    burst(x, y, intensity = 1) {
      const now = performance.now();
      const candidates = this.visibleNeurons();
      if (!candidates.length) return;
      candidates
        .map((neuron) => ({ neuron, distance: Math.hypot(neuron.screenX - x, neuron.screenY - y) + this.random() * 130 }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, Math.min(candidates.length, Math.round(11 + intensity * 12)))
        .forEach(({ neuron }, index) => {
          neuron.fireAt = now + index * (10 + this.random() * 10) + this.random() * 90;
        });
      this.pulses.push({ x, y, born: now, life: 620, intensity });
      if (this.reducedMotion) {
        candidates.slice(0, 14).forEach((neuron) => { neuron.spike = 1; });
        this.draw(now, 0);
      } else if (this.motionMode === "calm" && this.visible && !this.frameRequest) {
        this.lastTime = now;
        this.frameRequest = requestAnimationFrame(this.animate);
      }
    }

    randomSpike(time) {
      if (this.motionMode !== "active" || time < this.nextRandomSpike) return;
      const activeLayer = Math.round(this.depth);
      const local = this.neurons[activeLayer] || [];
      if (local.length) {
        const neuron = local[Math.floor(this.random() * local.length)];
        neuron.fireAt = time + this.random() * 160;
        if (this.random() > 0.72 && local.length > 2) {
          local[Math.floor(this.random() * local.length)].fireAt = time + 80 + this.random() * 220;
        }
      }
      this.nextRandomSpike = time + 260 + this.random() * 820;
    }

    animate(time) {
      this.frameRequest = 0;
      if (!this.visible) return;
      const dt = Math.min(0.05, Math.max(0.001, (time - this.lastTime) / 1000));
      this.lastTime = time;
      this.depth += (this.targetDepth - this.depth) * Math.min(1, dt * 6.5);
      this.randomSpike(time);
      this.draw(time, dt);
      const evokedActivity = this.pulses.length > 0 || this.neurons.flat().some((neuron) => neuron.fireAt || neuron.spike > 0);
      if (this.motionMode === "active" || evokedActivity) {
        this.frameRequest = requestAnimationFrame(this.animate);
      }
    }

    layerGeometry(layerIndex, time) {
      const span = this.height * 0.86;
      const separation = this.height * 0.76;
      const center = this.height * 0.51 + (layerIndex - this.depth) * separation;
      const distance = Math.abs(layerIndex - this.depth);
      const opacity = Math.max(0, 1 - distance * 0.58);
      const driftScale = this.motionMode === "active" ? 1 : 0;
      const horizontalOffset = Math.sin(time * 0.00008 + layerIndex * 1.7) * 22 * driftScale;
      return { span, center, distance, opacity, horizontalOffset };
    }

    draw(time, dt) {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.width, this.height);
      this.drawAmbient(ctx, time);

      LAYERS.forEach((layer, layerIndex) => {
        const geometry = this.layerGeometry(layerIndex, time);
        if (geometry.opacity <= 0.015) return;
        this.drawLayerBand(ctx, layer, geometry, layerIndex);
        this.drawFibers(ctx, layer, geometry, layerIndex, time);
        this.drawLayerNeurons(ctx, layer, geometry, layerIndex, time, dt);
      });

      this.drawPulses(ctx, time);
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }

    drawAmbient(ctx, time) {
      const gradient = ctx.createRadialGradient(
        this.width * (0.52 + Math.sin(time * 0.00007) * 0.04),
        this.height * 0.44,
        0,
        this.width * 0.5,
        this.height * 0.5,
        Math.max(this.width, this.height) * 0.72
      );
      gradient.addColorStop(0, this.palette.light ? "rgba(255,255,255,0.06)" : "rgba(121,242,192,0.025)");
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    drawLayerBand(ctx, layer, geometry, layerIndex) {
      const top = geometry.center - geometry.span / 2;
      const color = this.palette.light ? layer.lightColor : layer.color;
      const gradient = ctx.createLinearGradient(0, top, 0, top + geometry.span);
      const alpha = (this.palette.light ? 0.062 : 0.064) * geometry.opacity;
      gradient.addColorStop(0, "rgba(0,0,0,0)");
      gradient.addColorStop(0.45, this.toRgba(color, alpha));
      gradient.addColorStop(0.55, this.toRgba(color, alpha * 0.8));
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, top, this.width, geometry.span);

      ctx.save();
      ctx.globalAlpha = geometry.opacity * (this.palette.light ? 0.22 : 0.15);
      ctx.strokeStyle = color;
      ctx.lineWidth = 0.6;
      ctx.setLineDash([6, 12]);
      ctx.beginPath();
      ctx.moveTo(0, top + geometry.span * 0.04);
      ctx.lineTo(this.width, top + geometry.span * 0.04);
      ctx.stroke();
      ctx.restore();

      if (geometry.distance < 0.44 && this.width > 900) {
        ctx.save();
        ctx.globalAlpha = 0.07;
        ctx.fillStyle = color;
        ctx.font = "600 82px ui-sans-serif, system-ui";
        ctx.textAlign = "left";
        ctx.fillText(layer.code, this.width * 0.06, geometry.center + 24);
        ctx.restore();
      }
    }

    drawFibers(ctx, layer, geometry, layerIndex, time) {
      const top = geometry.center - geometry.span / 2;
      const fibers = this.fibers[layerIndex];
      const color = this.palette.light ? layer.lightColor : layer.color;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = layerIndex === 0 ? 0.8 : 0.55;
      ctx.globalAlpha = geometry.opacity * (this.palette.light ? 0.22 : 0.22);

      fibers.forEach((fiber, index) => {
        const phase = fiber.phase + time * 0.00008 * (this.motionMode === "active" ? 1 : 0);
        if (fiber.vertical) {
          const x = ((index + 1) / (fibers.length + 1)) * this.width + Math.sin(phase) * 40;
          ctx.beginPath();
          ctx.moveTo(x, top - 40);
          ctx.bezierCurveTo(
            x + Math.sin(phase + 1) * fiber.amplitude,
            geometry.center - geometry.span * 0.18,
            x + Math.cos(phase) * fiber.amplitude,
            geometry.center + geometry.span * 0.2,
            x + Math.sin(phase + 2) * 28,
            top + geometry.span + 40
          );
          ctx.stroke();
        } else {
          const y = top + fiber.y * geometry.span;
          ctx.beginPath();
          ctx.moveTo(-40, y);
          const segments = 6;
          for (let segment = 1; segment <= segments; segment += 1) {
            const x = (segment / segments) * (this.width + 80) - 40;
            const wave = Math.sin(segment * fiber.frequency + phase) * fiber.amplitude;
            ctx.lineTo(x, y + wave);
          }
          ctx.stroke();
        }
      });
      ctx.restore();
    }

    drawLayerNeurons(ctx, layer, geometry, layerIndex, time, dt) {
      const top = geometry.center - geometry.span / 2;
      const neurons = this.neurons[layerIndex];
      neurons.forEach((neuron) => {
        if (neuron.fireAt && time >= neuron.fireAt) {
          neuron.spike = 1.2;
          neuron.fireAt = 0;
        }
        if (neuron.spike > 0) neuron.spike = Math.max(0, neuron.spike - dt * 2.65);

        const drift = this.motionMode === "active" ? 1 : 0;
        const x = neuron.x * this.width + geometry.horizontalOffset + Math.sin(time * 0.00012 * neuron.drift + neuron.phase) * 9 * drift;
        const y = top + neuron.y * geometry.span + Math.cos(time * 0.0001 * neuron.drift + neuron.phase) * 7 * drift;
        neuron.screenX = x;
        neuron.screenY = y;
        if (x < -90 || x > this.width + 90 || y < -130 || y > this.height + 130) return;

        const centerBias = 1 - Math.min(1, Math.abs(y - this.height / 2) / (this.height * 0.72));
        const alpha = geometry.opacity * (0.16 + centerBias * 0.38) * (this.palette.light ? 0.96 : 1);
        this.drawNeuron(ctx, neuron, layer, x, y, alpha, time);
      });
    }

    drawNeuron(ctx, neuron, layer, x, y, alpha, time) {
      const color = this.palette.light ? layer.lightColor : layer.color;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(neuron.rotation);
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalAlpha = alpha;
      ctx.lineWidth = Math.max(0.55, neuron.size * 0.065);

      if (neuron.spike > 0) {
        const glow = Math.sin(Math.min(1, neuron.spike) * Math.PI);
        ctx.globalAlpha = Math.min(1, alpha + glow * 0.58);
        ctx.shadowColor = color;
        ctx.shadowBlur = 7 + glow * 22;
      }

      switch (neuron.morphology) {
        case "horizontal": this.drawHorizontalNeuron(ctx, neuron); break;
        case "pyramidal": this.drawPyramidalNeuron(ctx, neuron); break;
        case "fusiform": this.drawFusiformNeuron(ctx, neuron); break;
        default: this.drawStellateNeuron(ctx, neuron); break;
      }

      if (neuron.spike > 0) {
        const progress = 1 - Math.min(1, neuron.spike / 1.2);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = alpha * (1 - progress) * 1.5;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, neuron.size * (1.4 + progress * 3.2), 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    drawSoma(ctx, radius, triangular = false, elongated = false) {
      ctx.beginPath();
      if (triangular) {
        ctx.moveTo(0, -radius * 1.2);
        ctx.lineTo(radius * 0.95, radius * 0.75);
        ctx.quadraticCurveTo(0, radius * 1.05, -radius * 0.95, radius * 0.75);
        ctx.closePath();
      } else if (elongated) {
        ctx.ellipse(0, 0, radius * 1.35, radius * 0.68, 0, 0, Math.PI * 2);
      } else {
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
      }
      ctx.fill();
    }

    drawStellateNeuron(ctx, neuron) {
      const size = neuron.size;
      const branches = 6 + (neuron.branch % 3);
      for (let index = 0; index < branches; index += 1) {
        const angle = (index / branches) * Math.PI * 2 + neuron.phase * 0.16;
        const length = size * (2.2 + ((neuron.branch >> index) % 10) / 9);
        const bend = ((index % 2 === 0 ? 1 : -1) * size * 0.55);
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * size * 0.4, Math.sin(angle) * size * 0.4);
        const endX = Math.cos(angle) * length;
        const endY = Math.sin(angle) * length;
        ctx.quadraticCurveTo(
          Math.cos(angle) * length * 0.55 + Math.cos(angle + Math.PI / 2) * bend,
          Math.sin(angle) * length * 0.55 + Math.sin(angle + Math.PI / 2) * bend,
          endX,
          endY
        );
        ctx.stroke();
        if (index % 2 === 0) {
          ctx.beginPath();
          ctx.moveTo(endX * 0.72, endY * 0.72);
          ctx.lineTo(endX + Math.cos(angle + 0.55) * size * 0.9, endY + Math.sin(angle + 0.55) * size * 0.9);
          ctx.stroke();
        }
      }
      this.drawSoma(ctx, size * 0.48);
    }

    drawPyramidalNeuron(ctx, neuron) {
      const size = neuron.size;
      const apical = size * 5.3;
      ctx.beginPath();
      ctx.moveTo(0, -size * 0.8);
      ctx.bezierCurveTo(-size * 0.4, -size * 2, size * 0.25, -size * 3.7, 0, -apical);
      ctx.stroke();

      [[-0.8, -3.3], [0.82, -3.7], [-1.05, -2.3], [1.1, -2.6]].forEach(([direction, level], index) => {
        ctx.beginPath();
        ctx.moveTo(0, size * level);
        ctx.quadraticCurveTo(direction * size * 1.05, size * (level - 0.25), direction * size * (2 + index * 0.12), size * (level - 1.1));
        ctx.stroke();
      });

      for (let index = 0; index < 5; index += 1) {
        const direction = index < 2 ? -1 : 1;
        const offset = (index % 3) * 0.32;
        ctx.beginPath();
        ctx.moveTo(direction * size * 0.4, size * 0.35);
        ctx.quadraticCurveTo(direction * size * (1.2 + offset), size * (0.5 + offset), direction * size * (2.4 + offset), size * (0.1 + offset));
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.moveTo(0, size * 0.75);
      ctx.bezierCurveTo(size * 0.1, size * 2, -size * 0.18, size * 3.7, size * 0.3, size * 6.2);
      ctx.stroke();
      this.drawSoma(ctx, size * 0.58, true);
    }

    drawHorizontalNeuron(ctx, neuron) {
      const size = neuron.size;
      for (const direction of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(direction * size * 0.7, 0);
        ctx.bezierCurveTo(direction * size * 2, -size * 0.8, direction * size * 3.6, size * 0.7, direction * size * 6, -size * 0.2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(direction * size * 2.2, -size * 0.3);
        ctx.quadraticCurveTo(direction * size * 3.1, -size * 1.5, direction * size * 4.2, -size * 1.2);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(0, size * 0.5);
      ctx.quadraticCurveTo(size * 0.2, size * 2, -size * 0.4, size * 3.5);
      ctx.stroke();
      this.drawSoma(ctx, size * 0.5, false, true);
    }

    drawFusiformNeuron(ctx, neuron) {
      const size = neuron.size;
      ctx.beginPath();
      ctx.moveTo(0, -size * 0.6);
      ctx.bezierCurveTo(size * 0.6, -size * 2, -size * 0.5, -size * 3.4, size * 0.2, -size * 5.2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, size * 0.6);
      ctx.bezierCurveTo(-size * 0.7, size * 2, size * 0.5, size * 3.8, -size * 0.2, size * 5.4);
      ctx.stroke();
      for (const direction of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(direction * size * 0.4, 0);
        ctx.quadraticCurveTo(direction * size * 1.8, -size * 0.6, direction * size * 2.8, size * 0.3);
        ctx.stroke();
      }
      this.drawSoma(ctx, size * 0.55, false, true);
    }

    drawPulses(ctx, time) {
      this.pulses = this.pulses.filter((pulse) => time - pulse.born < pulse.life);
      this.pulses.forEach((pulse) => {
        const progress = Math.min(1, (time - pulse.born) / pulse.life);
        const radius = 12 + progress * 160 * pulse.intensity;
        ctx.save();
        ctx.globalAlpha = (1 - progress) * 0.34;
        ctx.strokeStyle = this.palette.accent;
        ctx.lineWidth = Math.max(0.5, 2.2 * (1 - progress));
        ctx.shadowColor = this.palette.accent;
        ctx.shadowBlur = 12 * (1 - progress);
        ctx.beginPath();
        ctx.arc(pulse.x, pulse.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });
    }

    toRgba(hex, alpha) {
      const normalized = hex.replace("#", "");
      if (!/^[0-9a-f]{6}$/i.test(normalized)) return `rgba(121, 242, 192, ${alpha})`;
      const value = Number.parseInt(normalized, 16);
      const red = (value >> 16) & 255;
      const green = (value >> 8) & 255;
      const blue = value & 255;
      return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
    }
  }

  const start = () => new CortexBackground();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();

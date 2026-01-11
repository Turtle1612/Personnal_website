(() => {
  "use strict";

  /* -----------------------------
    Utilities
  ------------------------------*/
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const state = {
    motionEnabled: true
  };

  /* -----------------------------
    Avatar placeholder (SVG)
    - You can create a local file named avatar-placeholder.svg next to index.html
    - If you already have one, keep it. Below is an optional helper that tries to fetch it;
      since file:// cannot be written from browser JS, we only provide a console snippet.
  ------------------------------*/
  const ensureAvatarHint = () => {
    // If avatar-placeholder.svg is missing, the image may break.
    // Provide user guidance in console.
    console.info(
      "Avatar: đặt file avatar-placeholder.svg cùng thư mục hoặc thay src trong index.html bằng ảnh của bạn (vd: avatar.jpg)."
    );
  };

  /* -----------------------------
    Smooth reveal on scroll
  ------------------------------*/
  const initReveal = () => {
    const els = $$(".reveal");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("is-visible");
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
  };

  /* -----------------------------
    Tilt effect (no library)
  ------------------------------*/
  const initTilt = () => {
    const tiltEls = $$("[data-tilt]");
    const maxTilt = 10; // degrees

    const handleMove = (el, ev) => {
      if (!state.motionEnabled) return;
      const r = el.getBoundingClientRect();
      const x = (ev.clientX - r.left) / r.width;
      const y = (ev.clientY - r.top) / r.height;

      const rotY = (x - 0.5) * (maxTilt * 2);
      const rotX = -(y - 0.5) * (maxTilt * 2);

      el.style.transform = `perspective(900px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translateY(-1px)`;
    };

    const reset = (el) => {
      el.style.transform = "";
    };

    tiltEls.forEach((el) => {
      el.addEventListener("mousemove", (ev) => handleMove(el, ev));
      el.addEventListener("mouseleave", () => reset(el));
      el.addEventListener("blur", () => reset(el));
    });
  };

  /* -----------------------------
    Typewriter loop
  ------------------------------*/
  const initTypewriter = () => {
    const el = $(".typewriter");
    if (!el) return;

    let words = [];
    try {
      words = JSON.parse(el.dataset.words || "[]");
    } catch {
      words = [];
    }
    if (!words.length) return;

    let wi = 0;
    let ci = 0;
    let deleting = false;

    const caret = document.createElement("span");
    caret.className = "caret";
    caret.textContent = "▍";

    const tick = () => {
      if (!state.motionEnabled) {
        // If motion disabled, show static text.
        el.textContent = words[0];
        if (!el.querySelector(".caret")) el.appendChild(caret);
        return;
      }

      const word = words[wi];
      const speed = deleting ? 28 : 42;

      if (!deleting) {
        ci++;
        if (ci >= word.length) {
          deleting = true;
          setTimeout(tick, 1000);
          el.textContent = word;
          el.appendChild(caret);
          return;
        }
      } else {
        ci--;
        if (ci <= 0) {
          deleting = false;
          wi = (wi + 1) % words.length;
          setTimeout(tick, 260);
          el.textContent = "";
          el.appendChild(caret);
          return;
        }
      }

      el.textContent = word.slice(0, ci);
      el.appendChild(caret);
      setTimeout(tick, speed);
    };

    tick();
  };

  /* -----------------------------
    Animated canvas background (particles + neon lines)
  ------------------------------*/
  const initCanvas = () => {
    const canvas = $("#bg-canvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    let w = 0, h = 0;
    let particles = [];
    const N = 95;

    const resize = () => {
      w = Math.floor(window.innerWidth);
      h = Math.floor(window.innerHeight);
      canvas.width = Math.floor(w * DPR);
      canvas.height = Math.floor(h * DPR);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };

    const rand = (a, b) => a + Math.random() * (b - a);

    const makeParticles = () => {
      particles = Array.from({ length: N }, () => ({
        x: rand(0, w),
        y: rand(0, h),
        vx: rand(-0.22, 0.22),
        vy: rand(-0.18, 0.18),
        r: rand(1.0, 2.1),
        a: rand(0.18, 0.60)
      }));
    };

    let mouse = { x: w * 0.5, y: h * 0.5, active: false };
    window.addEventListener("mousemove", (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    }, { passive: true });

    const draw = () => {
      if (!state.motionEnabled) {
        // Static background
        ctx.clearRect(0, 0, w, h);
        drawStatic();
        return;
      }

      ctx.clearRect(0, 0, w, h);

      // soft gradient wash
      const g = ctx.createRadialGradient(w * 0.2, h * 0.2, 60, w * 0.2, h * 0.2, Math.max(w, h));
      g.addColorStop(0, "rgba(57,246,255,0.10)");
      g.addColorStop(0.55, "rgba(255,61,242,0.06)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // update particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;
      }

      // connect particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // particle glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.a})`;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const d = Math.hypot(dx, dy);

          const maxD = 120;
          if (d < maxD) {
            const t = 1 - d / maxD;
            // neon line: alternate cyan/magenta subtle
            const nearMouse = mouse.active ? (1 - Math.min(1, Math.hypot((p.x - mouse.x), (p.y - mouse.y)) / 260)) : 0;
            const alpha = (0.06 + t * 0.12) + nearMouse * 0.06;

            ctx.strokeStyle = `rgba(57,246,255,${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();

            ctx.strokeStyle = `rgba(255,61,242,${alpha * 0.55})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x + 0.6, p.y + 0.6);
            ctx.lineTo(q.x + 0.6, q.y + 0.6);
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(draw);
    };

    const drawStatic = () => {
      // minimal static to avoid blank screen when motion off
      const g = ctx.createRadialGradient(w * 0.25, h * 0.25, 60, w * 0.25, h * 0.25, Math.max(w, h));
      g.addColorStop(0, "rgba(57,246,255,0.08)");
      g.addColorStop(0.6, "rgba(255,61,242,0.05)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // sprinkle points
      for (let i = 0; i < 70; i++) {
        const x = (i * 97) % w;
        const y = (i * 173) % h;
        ctx.fillStyle = "rgba(255,255,255,0.10)";
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const onResize = () => {
      resize();
      makeParticles();
    };

    window.addEventListener("resize", onResize, { passive: true });

    onResize();
    requestAnimationFrame(draw);
  };

  /* -----------------------------
    Motion toggle
  ------------------------------*/
  const initMotionToggle = () => {
    const btn = $("#toggle-motion");
    if (!btn) return;

    const setState = (enabled) => {
      state.motionEnabled = enabled;
      btn.setAttribute("aria-pressed", String(!enabled ? true : false)); // pressed = motion off
      btn.textContent = enabled ? "Motion" : "Motion Off";
      document.documentElement.dataset.motion = enabled ? "on" : "off";
    };

    btn.addEventListener("click", () => {
      setState(!state.motionEnabled);
    });

    // Respect prefers-reduced-motion initially
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) setState(false);
  };

  /* -----------------------------
    Contact form (demo only)
  ------------------------------*/
  const initForm = () => {
    const form = $("#contact-form");
    const note = $("#form-note");
    if (!form || !note) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const name = String(fd.get("name") || "").trim();

      note.textContent = `Đã nhận thông tin. Cảm ơn ${name || "bạn"}! (Demo: bạn có thể tích hợp EmailJS/Formspree/Backend để gửi thật.)`;
      form.reset();
    });
  };

  /* -----------------------------
    Footer year
  ------------------------------*/
  const initYear = () => {
    const y = $("#year");
    if (y) y.textContent = String(new Date().getFullYear());
  };

  /* -----------------------------
    Create local placeholder SVG (copy-paste)
    - Because browser cannot write files to disk, we provide a copy string.
  ------------------------------*/
  const printAvatarPlaceholderSVG = () => {
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900">
  <defs>
    <radialGradient id="g1" cx="30%" cy="25%" r="70%">
      <stop offset="0%" stop-color="#39f6ff" stop-opacity="0.35"/>
      <stop offset="55%" stop-color="#ff3df2" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#070912" stop-opacity="1"/>
    </radialGradient>
    <linearGradient id="g2" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#39f6ff" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#ff3df2" stop-opacity="0.85"/>
    </linearGradient>
    <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="10" result="b"/>
      <feMerge>
        <feMergeNode in="b"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <rect width="900" height="900" rx="80" fill="url(#g1)"/>
  <circle cx="450" cy="380" r="140" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.16)" stroke-width="2"/>
  <path d="M260 730c35-150 140-235 190-235s155 85 190 235" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.14)" stroke-width="2"/>

  <text x="50%" y="53%" text-anchor="middle" font-family="Space Grotesk, Arial" font-size="140" font-weight="700"
        fill="url(#g2)" filter="url(#glow)">LN</text>

  <text x="50%" y="85%" text-anchor="middle" font-family="Space Grotesk, Arial" font-size="34" font-weight="600"
        fill="rgba(255,255,255,0.70)">Lê Thanh Nhiều</text>
</svg>
`.trim();

    console.groupCollapsed("avatar-placeholder.svg (copy content below into a file named avatar-placeholder.svg)");
    console.log(svg);
    console.groupEnd();
  };

  /* -----------------------------
    Init
  ------------------------------*/
  const init = () => {
    ensureAvatarHint();
    initMotionToggle();
    initReveal();
    initTilt();
    initTypewriter();
    initCanvas();
    initForm();
    initYear();
    printAvatarPlaceholderSVG();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

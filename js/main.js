// ====== Loader ======
(function loader() {
  const el = document.querySelector(".loader");
  if (!el) return;
  document.documentElement.classList.add("is-loading");
  // animate letters in
  const chars = el.querySelectorAll(".ch");
  chars.forEach((c, i) => { c.style.animationDelay = (0.05 + i * 0.05) + "s"; });
  // dismiss after bar finishes
  const dismiss = () => {
    el.classList.add("done");
    document.documentElement.classList.remove("is-loading");
    setTimeout(() => el.remove(), 900);
  };
  // Either bar animation end OR a hard ceiling
  const bar = el.querySelector(".loader-bar");
  if (bar) bar.addEventListener("animationend", dismiss, { once: true });
  setTimeout(dismiss, 2200);
})();

// ====== Topographical line generation ======
function topoRing(cx, cy, r, seed) {
  const N = 28;
  const pts = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const rj = r
      + Math.sin(a * 3 + seed) * r * 0.12
      + Math.cos(a * 5 + seed * 1.7) * r * 0.06;
    pts.push([cx + Math.cos(a) * rj, cy + Math.sin(a) * rj]);
  }
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < N; i++) {
    const p0 = pts[(i - 1 + N) % N];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % N];
    const p3 = pts[(i + 2) % N];
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d + " Z";
}
function buildTopo(el, cx, cy, count, baseR, step, seed) {
  if (!el) return;
  let html = "";
  for (let i = 0; i < count; i++) {
    html += `<path d="${topoRing(cx, cy, baseR + step * i, seed + i * 0.6)}"/>`;
  }
  el.innerHTML = html;
}
buildTopo(document.getElementById("topo-a"), 320, 380, 5, 110, 95, 1.3);
buildTopo(document.getElementById("topo-b"), 1280, 640, 4, 100, 110, 4.1);
buildTopo(document.getElementById("topo-c1"), 240, 280, 4, 90, 80, 2.1);
buildTopo(document.getElementById("topo-c2"), 1380, 780, 5, 110, 100, 5.3);

// ====== Reveal on scroll ======
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      e.target.classList.add("in");
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

// ====== Scroll progress ======
const progress = document.querySelector(".scroll-progress");
if (progress) {
  const onScroll = () => {
    const h = document.documentElement;
    const pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
    progress.style.width = `${pct}%`;
  };
  document.addEventListener("scroll", onScroll, { passive: true });
}

// ====== Custom cursor ======
const dot = document.querySelector(".cursor-dot");
const ring = document.querySelector(".cursor-ring");
if (dot && ring && window.matchMedia("(min-width: 901px)").matches) {
  let mx = 0, my = 0, rx = 0, ry = 0;
  document.addEventListener("mousemove", (e) => {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;
  });
  const tick = () => {
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
    requestAnimationFrame(tick);
  };
  tick();
  document.querySelectorAll("a, button, .project, .fact, .hero-photo").forEach((el) => {
    el.addEventListener("mouseenter", () => ring.classList.add("hover"));
    el.addEventListener("mouseleave", () => ring.classList.remove("hover"));
  });
}

// ====== Project spotlight ======
document.querySelectorAll(".project").forEach((card) => {
  card.addEventListener("mousemove", (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${e.clientX - r.left}px`);
    card.style.setProperty("--my", `${e.clientY - r.top}px`);
  });
});

// Legacy hero-photo tilt — kept for work.html / projects.html
const photo = document.querySelector(".hero-photo");
const photoImg = photo?.querySelector("img");
if (photo && photoImg) {
  const maxRot = 5;
  photo.addEventListener("mousemove", (e) => {
    const r = photo.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    photo.style.transform = `perspective(1100px) rotateY(${px * maxRot}deg) rotateX(${-py * maxRot}deg)`;
  });
  photo.addEventListener("mouseleave", () => {
    photo.style.transform = "perspective(1100px) rotateY(0) rotateX(0)";
  });
}

// ====== Magnetic buttons ======
document.querySelectorAll(".btn").forEach((btn) => {
  btn.addEventListener("mousemove", (e) => {
    const r = btn.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;
    btn.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
  });
  btn.addEventListener("mouseleave", () => {
    btn.style.transform = "translate(0, 0)";
  });
});

// ====== Hero parallax on scroll ======
const heroPhoto = document.querySelector(".hero-photo");
if (heroPhoto) {
  let lastY = 0, ticking = false;
  const apply = () => {
    const y = window.scrollY;
    heroPhoto.style.setProperty("--py", `${y * -0.06}px`);
    ticking = false;
  };
  document.addEventListener("scroll", () => {
    if (!ticking) { requestAnimationFrame(apply); ticking = true; }
  }, { passive: true });
}

// ====== STAGE: whole-scene scale + word reveal + portrait tilt ======
(function stage() {
  const stage = document.querySelector(".stage");
  const pin = document.getElementById("stagePin");
  const frame = document.getElementById("frame");
  const text = document.getElementById("stageText");
  const words = text ? [...text.querySelectorAll(".w")] : [];
  if (!stage || !pin || !frame || !text) return;

  // Lerped state — gives the scale + tilt natural momentum.
  let pTarget = 0, p = 0;
  let txTarget = 0, tyTarget = 0;
  let tx = 0, ty = 0;
  const TILT_MAX = 7;       // tilt is applied only to the portrait
  const P_LERP = 0.12;
  const T_LERP = 0.10;

  // Read scroll position → set targets. Scale completes by raw=0.55 so the
  // last ~45% of the runway is a "hold" with the tile at final size.
  const sampleScroll = () => {
    const rect = stage.getBoundingClientRect();
    const viewport = window.innerHeight;
    const total = stage.offsetHeight - viewport;
    const passed = Math.min(Math.max(-rect.top, 0), total);
    const raw = total > 0 ? passed / total : 0;
    const morphEnd = 0.55;
    const linear = raw < morphEnd ? raw / morphEnd : 1;
    // ease-out cubic
    pTarget = 1 - Math.pow(1 - linear, 3);
    stage.style.setProperty("--raw", raw.toFixed(4));
  };
  document.addEventListener("scroll", sampleScroll, { passive: true });
  window.addEventListener("resize", sampleScroll, { passive: true });
  sampleScroll();

  // Cursor anywhere on the stage-pin drives tilt — applied only to .frame.
  pin.addEventListener("mousemove", (e) => {
    const r = pin.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    tyTarget = px * TILT_MAX;
    txTarget = -py * TILT_MAX;
  });
  pin.addEventListener("mouseleave", () => { txTarget = 0; tyTarget = 0; });

  // === Touch devices: device-orientation drives tilt ===
  // On a phone there's no cursor, so we read the gyro instead. First
  // event sets the resting baseline; subsequent samples are deltas from
  // it so the portrait sits flat when the phone is held normally and
  // tilts as you rotate the device.
  //
  // iOS 13+ requires explicit permission via a user gesture — we ask
  // on first touch. Android & older iOS get the listener attached
  // directly. Non-touch devices (desktop) skip this whole block so the
  // mouse tilt isn't fought by ambient laptop-accelerometer noise.
  const isTouch = matchMedia && matchMedia("(pointer: coarse)").matches;
  if (isTouch && typeof DeviceOrientationEvent !== "undefined") {
    let baseBeta = null, baseGamma = null;
    const ORIENT_GAIN = 0.4;     // 1° phone tilt → 0.4° card tilt
    const ORIENT_DEADZONE = 1.5; // ignore micro-jitter near baseline (deg)

    const onOrient = (e) => {
      if (e.beta == null || e.gamma == null) return;
      if (baseBeta == null) { baseBeta = e.beta; baseGamma = e.gamma; return; }
      let dBeta  = e.beta  - baseBeta;
      let dGamma = e.gamma - baseGamma;
      if (Math.abs(dBeta)  < ORIENT_DEADZONE) dBeta  = 0;
      if (Math.abs(dGamma) < ORIENT_DEADZONE) dGamma = 0;
      const clamp = (v) => Math.max(-TILT_MAX, Math.min(TILT_MAX, v));
      tyTarget = clamp(dGamma * ORIENT_GAIN);  // left-right tilt → Y rotation
      txTarget = clamp(-dBeta * ORIENT_GAIN);  // front-back tilt → X rotation
    };

    if (typeof DeviceOrientationEvent.requestPermission === "function") {
      // iOS 13+ — must be triggered by a user gesture.
      const enable = () => {
        DeviceOrientationEvent.requestPermission()
          .then((state) => {
            if (state === "granted") {
              window.addEventListener("deviceorientation", onOrient, true);
            }
          })
          .catch(() => { /* user declined — silent */ });
        window.removeEventListener("touchstart", enable, true);
      };
      window.addEventListener("touchstart", enable, true);
    } else {
      // Android / older iOS — wire up directly.
      window.addEventListener("deviceorientation", onOrient, true);
    }
  }

  // Single rAF loop drives both scale + tilt with lerp momentum.
  const tick = () => {
    p  += (pTarget  - p)  * P_LERP;
    tx += (txTarget - tx) * T_LERP;
    ty += (tyTarget - ty) * T_LERP;
    if (Math.abs(pTarget - p)  < 0.0005) p  = pTarget;
    if (Math.abs(txTarget - tx) < 0.01)  tx = txTarget;
    if (Math.abs(tyTarget - ty) < 0.01)  ty = tyTarget;

    stage.style.setProperty("--p", p.toFixed(4));
    /* Tilt vars are set on the stage-pin (the common ancestor of .frame
       and .wf) so both the portrait AND the wireframe glasses can read
       them — the glasses then mirror the same tilt + parallax to feel
       attached to the face. */
    pin.style.setProperty("--tilt-x", tx.toFixed(2) + "deg");
    pin.style.setProperty("--tilt-y", ty.toFixed(2) + "deg");
    /* Unitless mirrors of the tilt — usable with calc() * px for parallax /
       sheen translations (you can't multiply deg by px). */
    pin.style.setProperty("--tilt-xn", tx.toFixed(2));
    pin.style.setProperty("--tilt-yn", ty.toFixed(2));

    // Past 55% progress: stage enters dark phase (manifesto reveals).
    // Nav color is handled by the global tracker below, not here.
    const dark = p > 0.55;
    stage.classList.toggle("dark", dark);

    // Word reveal off raw scroll (snappy, no lerp).
    const raw = parseFloat(stage.style.getPropertyValue("--raw")) || 0;
    const wordStart = 0.55;
    const wordEnd = 0.95;
    words.forEach((w, i) => {
      const t = wordStart + (i / (words.length - 1)) * (wordEnd - wordStart);
      if (raw >= t) w.classList.add("in");
      else w.classList.remove("in");
    });

    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();

// ====== Animated counters ======
const counters = document.querySelectorAll("[data-count]");
const cIo = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    const el = e.target;
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    const dur = 1500;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      const val = target * eased;
      el.textContent = (target % 1 === 0 ? Math.round(val) : val.toFixed(1)) + suffix;
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    cIo.unobserve(el);
  });
}, { threshold: 0.4 });
counters.forEach((el) => cIo.observe(el));

// ====== Horizontal scroll — pinned section, track translates X as Y scrolls ======
(function hscroll() {
  const wrap = document.querySelector(".hscroll");
  const track = document.getElementById("hscrollTrack");
  if (!wrap || !track) return;

  const update = () => {
    const rect = wrap.getBoundingClientRect();
    const vh = window.innerHeight;
    const totalRunway = wrap.offsetHeight - vh;
    const passed = Math.min(Math.max(-rect.top, 0), totalRunway);
    const progress = totalRunway > 0 ? passed / totalRunway : 0;
    const maxX = track.scrollWidth - window.innerWidth;
    if (maxX > 0) {
      track.style.transform = `translateX(${-progress * maxX}px)`;
    }
  };

  document.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update, { passive: true });
  update();
})();

// ====== Nav color tracker ======
// Probes the element behind the nav at the top of the viewport and toggles
// `body.nav-on-dark` based on the actual rendered background luminance.
// Works across all pages (home stage, work timeline, projects, etc.).
(function navTracker() {
  const PROBE_Y = 36;  // y-coord where the nav text sits
  const luminance = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
  const isLight = (el) => {
    let cur = el;
    while (cur && cur !== document.documentElement) {
      const bg = getComputedStyle(cur).backgroundColor;
      if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
        const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (m) {
          const a = bg.match(/rgba?\([^)]+,\s*([\d.]+)\)/);
          const alpha = a ? parseFloat(a[1]) : 1;
          if (alpha > 0.5) {
            return luminance(+m[1], +m[2], +m[3]) > 140;
          }
        }
      }
      cur = cur.parentElement;
    }
    // Fall back to body bg
    const bodyBg = getComputedStyle(document.body).backgroundColor;
    const m = bodyBg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    return m ? luminance(+m[1], +m[2], +m[3]) > 140 : false;
  };

  const update = () => {
    // Sample a few X positions across the nav to pick the dominant bg
    const xs = [40, window.innerWidth / 2, window.innerWidth - 40];
    let lightVotes = 0;
    xs.forEach((x) => {
      const stack = document.elementsFromPoint(x, PROBE_Y);
      const target = stack.find((el) => {
        if (!el.classList) return false;
        // Skip nav/cursor/overlay elements
        return !(
          el.classList.contains("nav") ||
          el.closest(".nav") ||
          el.classList.contains("cursor-dot") ||
          el.classList.contains("cursor-ring") ||
          el.classList.contains("scroll-progress") ||
          el.classList.contains("grain") ||
          el.classList.contains("loader") ||
          el.closest(".loader")
        );
      });
      if (target && isLight(target)) lightVotes++;
    });
    const onLight = lightVotes >= 2;
    document.body.classList.toggle("nav-on-dark", !onLight);
  };

  document.addEventListener("scroll", update, { passive: true });
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update, { passive: true });
  // initial calls in case fonts/images shift layout
  setTimeout(update, 100);
  setTimeout(update, 500);
  setTimeout(update, 1500);
})();

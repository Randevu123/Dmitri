(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- boot ---------- */
  const boot = $("#boot"), log = $("#bootLog"), bar = $("#bootBar"), pct = $("#bootPct");
  const lines = [
    ["> GHD-OS v4.0.26 // concordia node", ""],
    ["> mount /dev/sapientia/applicants", "ok"],
    ["> decrypt application_026.enc", "ok"],
    ["> verify subject: Шостакович Д.Д.", "ok"],
    ["> check firewall integrity", "err"],
    ["  patch proposal found (author: subject) ... applied", "ok"],
    ["> load hotfix_block.exe", "ok"],
    ["> render profile", ""]
  ];
  function runBoot() {
    document.body.classList.add("is-booting");
    let i = 0, p = 0;
    const step = () => {
      if (i < lines.length) {
        const [t, s] = lines[i++];
        const tag = s === "ok" ? ' <span class="ok">[ OK ]</span>' : s === "err" ? ' <span class="err">[WARN]</span>' : "";
        log.insertAdjacentHTML("beforeend", t.replace(/</g, "&lt;") + tag + "\n");
      }
      p = Math.min(100, p + 7 + Math.random() * 11);
      bar.style.width = p + "%";
      pct.textContent = String(Math.floor(p)).padStart(3, "0");
      if (p < 100) setTimeout(step, 70 + Math.random() * 90);
      else {
        while (i < lines.length) {
          const [t, s] = lines[i++];
          log.insertAdjacentHTML("beforeend", t.replace(/</g, "&lt;") + (s === "ok" ? ' <span class="ok">[ OK ]</span>' : "") + "\n");
        }
        log.insertAdjacentHTML("beforeend", '<span class="ok">> access granted_</span>');
        setTimeout(endBoot, 420);
      }
    };
    step();
  }
  function endBoot() {
    boot.classList.add("is-done");
    document.body.classList.remove("is-booting");
    try { sessionStorage.setItem("booted", "1"); } catch (e) {}
    setTimeout(() => boot.remove(), 600);
  }
  let seen = false;
  try { seen = sessionStorage.getItem("booted") === "1"; } catch (e) {}
  if (reduce || seen) { boot.remove(); } else { runBoot(); }


  /* ---------- fit text to container width ---------- */
  const fitEls = $$("[data-fit]");
  function fitAll() {
    fitEls.forEach(el => {
      el.style.fontSize = "100px";
      const inner = el.firstElementChild || el;
      const w = inner.getBoundingClientRect().width, cw = el.clientWidth;
      if (w && cw) el.style.fontSize = Math.floor((100 * cw / w) * 0.985) + "px";
    });
  }
  fitAll();
  addEventListener("resize", fitAll);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll);

  /* ---------- panic hex dump ---------- */
  const hex = $("#panicHex");
  if (hex) {
    const rows = [];
    for (let r = 0; r < 22; r++) {
      let line = (0xdead0000 + r * 16).toString(16).toUpperCase() + "  ";
      for (let c = 0; c < 8; c++) line += ((Math.random() * 65536) | 0).toString(16).padStart(4, "0").toUpperCase() + " ";
      rows.push(line);
    }
    hex.textContent = rows.join("\n");
  }

  /* ---------- clock ---------- */
  const clock = $("#clock");
  const tick = () => { clock.textContent = new Date().toTimeString().slice(0, 8); };
  tick(); setInterval(tick, 1000);

  /* ---------- progress + active nav ---------- */
  const prog = $("#progress");
  const navLinks = $$(".nav__index a");
  const secs = navLinks.map(a => $(a.getAttribute("href")));
  const onScroll = () => {
    const h = document.documentElement;
    prog.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100 + "%";
    let cur = -1;
    secs.forEach((s, i) => { if (s && s.getBoundingClientRect().top < innerHeight * 0.4) cur = i; });
    navLinks.forEach((a, i) => a.classList.toggle("is-on", i === cur));
    oathUpdate();
  };
  addEventListener("scroll", onScroll, { passive: true });

  /* ---------- text scramble ---------- */
  const glyphs = "!<>-_\\/[]{}=+*^?#01";
  function scramble(el) {
    const final = el.dataset.final || el.textContent;
    el.dataset.final = final;
    let frame = 0;
    const total = 18;
    const run = () => {
      const progress = frame / total;
      el.textContent = final.split("").map((c, i) => {
        if (c === " ") return " ";
        return i / final.length < progress ? c : glyphs[(Math.random() * glyphs.length) | 0];
      }).join("");
      if (++frame <= total) requestAnimationFrame(run); else el.textContent = final;
    };
    run();
  }

  /* ---------- reveal ---------- */
  const revealTargets = $$(".sec__head, .ident > *, .look > *, .persona__keys, .card, .lhs__col, .stats > *, .skill, .panic > *, .hotfix > *, .trait, .inv__item, .oath__label");
  revealTargets.forEach(el => el.classList.add("rv"));
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      el.classList.add("in");
      const sc = el.querySelector && el.querySelector(".scramble");
      if (sc && !reduce) scramble(sc);
      if (el.classList.contains("stats") || el.closest(".stats")) runStats();
      io.unobserve(el);
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
  revealTargets.forEach(el => io.observe(el));

  /* ---------- radar ---------- */
  const stats = [["체력", 90], ["공격력", 10], ["방어력", 90], ["민첩성", 50], ["정확성", 10], ["정신력", 70]];
  const R = 100;
  const pt = (i, r) => {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / 6;
    return [Math.cos(a) * r, Math.sin(a) * r];
  };
  const svgNS = "http://www.w3.org/2000/svg";
  const grid = $(".radar__grid"), labels = $(".radar__labels"), shape = $(".radar__shape");
  [0.25, 0.5, 0.75, 1].forEach(f => {
    const p = document.createElementNS(svgNS, "polygon");
    p.setAttribute("points", stats.map((_, i) => pt(i, R * f).join(",")).join(" "));
    grid.appendChild(p);
  });
  stats.forEach(([name, v], i) => {
    const l = document.createElementNS(svgNS, "line");
    const [x, y] = pt(i, R);
    l.setAttribute("x1", 0); l.setAttribute("y1", 0); l.setAttribute("x2", x); l.setAttribute("y2", y);
    grid.appendChild(l);
    const [lx, ly] = pt(i, R + 18);
    const t = document.createElementNS(svgNS, "text");
    t.setAttribute("x", lx); t.setAttribute("y", ly - 3); t.setAttribute("text-anchor", "middle");
    t.textContent = name; labels.appendChild(t);
    const tv = document.createElementNS(svgNS, "text");
    tv.setAttribute("x", lx); tv.setAttribute("y", ly + 8); tv.setAttribute("text-anchor", "middle");
    tv.setAttribute("class", "v"); tv.textContent = v; labels.appendChild(tv);
  });
  let statsDone = false;
  function runStats() {
    if (statsDone) return; statsDone = true;
    shape.setAttribute("points", stats.map(([, v], i) => pt(i, (R * v) / 100).join(",")).join(" "));
    $$("#bars li").forEach((li, i) => setTimeout(() => { $("i", li).style.width = li.dataset.v + "%"; }, i * 90));
  }
  if (reduce) runStats();

  /* ---------- portrait glitch ---------- */
  const portrait = $("#portrait");
  if (!reduce) {
    const glitchOnce = () => {
      portrait.classList.add("is-glitching");
      setTimeout(() => portrait.classList.remove("is-glitching"), 120 + Math.random() * 160);
      setTimeout(glitchOnce, 1800 + Math.random() * 3200);
    };
    setTimeout(glitchOnce, 2200);
    portrait.addEventListener("mouseenter", () => portrait.classList.add("is-glitching"));
    portrait.addEventListener("mouseleave", () => portrait.classList.remove("is-glitching"));
  }

  /* ---------- kernel panic trigger ---------- */
  $("#panicBtn").addEventListener("click", () => {
    if (reduce) return;
    document.body.classList.remove("is-crash");
    void document.body.offsetWidth;
    document.body.classList.add("is-crash");
    setTimeout(() => document.body.classList.remove("is-crash"), 950);
  });

  /* ---------- hotfix simulator ---------- */
  const sim = $("#sim"), field = $("#simField"), dEl = $("#simD"), nEl = $("#simN"), sEl = $("#simS");
  const deployBtn = $("#simDeploy"), resetBtn = $("#simReset");
  let uses = 0, resetting = false;
  const diameter = n => Math.max(4, 10 - Math.floor((n - 1) / 2));
  const render = () => {
    const d = uses ? diameter(uses) : 10;
    field.style.setProperty("--d", d);
    dEl.textContent = d;
    nEl.textContent = uses;
    field.classList.toggle("is-on", uses > 0);
    if (!resetting) sEl.textContent = uses === 0 ? "READY" : uses >= 2 ? "UNSTABLE" : "ACTIVE";
    resetBtn.disabled = resetting || uses === 0;
    deployBtn.disabled = resetting;
  };
  deployBtn.addEventListener("click", () => {
    if (resetting) return;
    uses++;
    sim.classList.add("is-used");
    field.classList.remove("is-on"); void field.offsetWidth;
    render();
  });
  resetBtn.addEventListener("click", () => {
    if (resetting || !uses) return;
    resetting = true; sim.classList.add("is-reset");
    let left = 300;
    const loop = setInterval(() => {
      left -= 6;
      const m = Math.max(0, left);
      sEl.textContent = "VULNERABLE " + Math.floor(m / 60) + ":" + String(m % 60).padStart(2, "0");
      if (left <= 0) {
        clearInterval(loop); resetting = false; uses = 0; sim.classList.remove("is-reset"); render();
      }
    }, 100);
    render();
  });
  render();

  /* ---------- oath word reveal ---------- */
  const oath = $("#oath");
  const words = oath.textContent.trim().split(/\s+/);
  oath.innerHTML = words.map(w => `<span class="w">${w}</span>`).join(" ");
  const ws = $$(".w", oath);
  function oathUpdate() {
    const r = oath.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.35)));
    const n = Math.round(p * ws.length);
    ws.forEach((w, i) => w.classList.toggle("on", reduce || i < n));
  }
  onScroll();
})();

(() => {
  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;

  // Entrada da abertura
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add("loaded")));

  // Menu
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".main-nav");
  const setMenu = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    nav.classList.toggle("open", open);
    header.classList.toggle("menu-open", open);
  };
  toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
  nav.addEventListener("click", (e) => e.target.closest("a") && setMenu(false));
  document.addEventListener("keydown", (e) => e.key === "Escape" && setMenu(false));

  // Placa em modal
  const plaque = document.getElementById("placa");
  const openBtn = document.querySelector("[data-plaque-open]");
  if (plaque && openBtn && typeof plaque.showModal === "function") {
    openBtn.addEventListener("click", () => {
      plaque.showModal();
      document.body.classList.add("dialog-open");
      plaque.querySelector(".plaque").scrollTop = 0;
    });
    plaque.querySelector("[data-plaque-close]").addEventListener("click", () => plaque.close());
    plaque.addEventListener("click", (e) => { if (e.target === plaque) plaque.close(); });
    plaque.addEventListener("close", () => { document.body.classList.remove("dialog-open"); openBtn.focus(); });
  }

  // Rolagem: cabeçalho, barra de leitura e paralaxe
  const progress = document.querySelector(".reading-progress");
  const parallax = [...document.querySelectorAll("[data-parallax]")];
  let lastY = scrollY;
  let ticking = false;
  const onScroll = () => {
    const y = scrollY;
    header.classList.toggle("scrolled", y > 24);
    header.classList.toggle("hidden", y > lastY && y > 400 && !nav.classList.contains("open"));
    lastY = y;
    const max = root.scrollHeight - innerHeight;
    progress.style.setProperty("--progress", max > 0 ? y / max : 0);
    if (!reduce) {
      parallax.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        const offset = (r.top + r.height / 2 - innerHeight / 2) * parseFloat(el.dataset.parallax);
        const img = el.querySelector("img");
        if (img) img.style.setProperty("--py", `${offset}px`);
      });
    }
    ticking = false;
  };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  // Item do menu ativo
  const links = [...nav.querySelectorAll("a")];
  const spy = new IntersectionObserver(
    (entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${entry.target.id}`));
    }),
    { rootMargin: "-45% 0px -50% 0px" }
  );
  document.querySelectorAll("main section[id]").forEach((s) => spy.observe(s));

  // Revelar ao rolar
  const io = new IntersectionObserver(
    (entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      io.unobserve(entry.target);
    }),
    { rootMargin: "0px 0px -10% 0px" }
  );
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  // Linha do tempo: desenha a linha e conta os anos
  const timeline = document.querySelector(".timeline");
  const countUp = (el) => {
    const end = +el.dataset.count;
    const start = end - 30;
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / 1400);
      el.textContent = Math.round(start + (end - start) * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  new IntersectionObserver((entries, obs) => {
    if (!entries[0].isIntersecting) return;
    timeline.classList.add("drawn");
    if (!reduce) timeline.querySelectorAll("[data-count]").forEach(countUp);
    obs.disconnect();
  }, { threshold: 0.4 }).observe(timeline);

  // Letreiro de cidades: duplica o conteúdo para girar sem emenda
  const track = document.querySelector(".marquee-track");
  track.innerHTML += track.innerHTML;
  [...track.children].slice(track.children.length / 2).forEach((s) => s.setAttribute("aria-hidden", "true"));

  // Valores acendendo um a um
  const values = [...document.querySelectorAll(".values li")];
  if (!reduce) {
    let n = 0;
    setInterval(() => {
      values.forEach((v, i) => v.classList.toggle("lit", i === n % values.length));
      n++;
    }, 1600);
  }

  // Celular: a capa se move com o giroscópio (precisa de HTTPS; no iPhone pede permissão no primeiro toque)
  const heroEl = document.querySelector(".hero");
  if (!fine && !reduce && "DeviceOrientationEvent" in window) {
    let base = null, tx = 0, ty = 0, cx = 0, cy = 0, raf = 0, visible = true;
    const clamp = (v) => Math.max(-1, Math.min(1, v));
    const frame = () => {
      cx += (tx - cx) * 0.12; cy += (ty - cy) * 0.12;
      heroEl.style.setProperty("--px", cx.toFixed(3));
      heroEl.style.setProperty("--py", cy.toFixed(3));
      heroEl.style.setProperty("--mx", `${50 + cx * 30}%`);
      heroEl.style.setProperty("--my", `${40 + cy * 20}%`);
      raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.002 ? requestAnimationFrame(frame) : 0;
    };
    const onTilt = (e) => {
      if (e.gamma == null || e.beta == null || !visible) return;
      // Em pé usa gamma (esq./dir.) e beta (frente/trás); deitado, os eixos trocam
      const angle = (screen.orientation && screen.orientation.angle) || 0;
      let x = e.gamma, y = e.beta;
      if (angle === 90) { x = e.beta; y = -e.gamma; }
      else if (angle === 270 || angle === -90) { x = -e.beta; y = e.gamma; }
      if (!base) { base = { x, y }; heroEl.classList.add("gyro"); }
      // O ponto neutro acompanha devagar a posição em que a pessoa segura o aparelho
      base.x += (x - base.x) * 0.01; base.y += (y - base.y) * 0.01;
      tx = clamp((x - base.x) / 18); ty = clamp((y - base.y) / 18);
      if (!raf) raf = requestAnimationFrame(frame);
    };
    // Android já envia os dados; o iPhone só depois da permissão, pedida no primeiro toque
    addEventListener("deviceorientation", onTilt, { passive: true });
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(heroEl);
    addEventListener("orientationchange", () => { base = null; });
    if (typeof DeviceOrientationEvent.requestPermission === "function") {
      addEventListener("touchend", () => {
        try { Promise.resolve(DeviceOrientationEvent.requestPermission()).catch(() => {}); } catch (_) {}
      }, { once: true });
    }
  }

  if (!fine || reduce) return;

  // Abertura: brilho que segue o mouse e camadas (halo, estátua, título) com profundidade
  const hero = heroEl;
  hero.addEventListener("pointermove", (e) => {
    const r = hero.getBoundingClientRect();
    hero.style.setProperty("--mx", `${e.clientX - r.left}px`);
    hero.style.setProperty("--my", `${e.clientY - r.top}px`);
    hero.style.setProperty("--px", ((e.clientX - r.left) / r.width - 0.5) * 2);
    hero.style.setProperty("--py", ((e.clientY - r.top) / r.height - 0.5) * 2);
  });

  // Luz nos cartões da família
  document.querySelectorAll(".member").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--cx", `${e.clientX - r.left}px`);
      card.style.setProperty("--cy", `${e.clientY - r.top}px`);
    });
  });
})();

// Partículas douradas e marsala flutuando na abertura
(() => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const canvas = document.querySelector(".hero-dust");
  const ctx = canvas.getContext("2d");
  const colors = ["201,140,137", "232,206,170", "244,239,233"];
  let w, h, dots, running = true;
  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(70, (w * h) / 22000));
    dots = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: Math.random() * 1.8 + 0.4,
      vy: -(Math.random() * 0.25 + 0.05), vx: (Math.random() - 0.5) * 0.15,
      a: Math.random() * 0.6 + 0.15, p: Math.random() * Math.PI * 2,
      c: colors[(Math.random() * colors.length) | 0],
    }));
  };
  const draw = (t) => {
    if (!running) return;
    ctx.clearRect(0, 0, w, h);
    for (const d of dots) {
      d.x += d.vx; d.y += d.vy;
      if (d.y < -5) { d.y = h + 5; d.x = Math.random() * w; }
      const alpha = d.a * (0.6 + 0.4 * Math.sin(t / 900 + d.p));
      ctx.beginPath();
      ctx.fillStyle = `rgba(${d.c},${alpha})`;
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(draw);
  };
  resize();
  addEventListener("resize", resize);
  new IntersectionObserver(([e]) => {
    const was = running;
    running = e.isIntersecting;
    if (running && !was) requestAnimationFrame(draw);
  }).observe(canvas);
  requestAnimationFrame(draw);
})();

/**
 * Weather Backgrounds for Home Assistant
 *
 * Dynamically sets the dashboard background based on a weather entity's state.
 * Uses Home Assistant's render_template WebSocket subscription for reactive updates.
 *
 * Configuration priority:
 *   1. Dashboard YAML view config (weather_backgrounds key)
 *   2. window.weatherBackgroundsConfig (set by a separate script)
 *   3. Auto-discover first weather.* entity + built-in defaults
 */

const DEFAULT_BACKGROUNDS = {
  sunny: "/hacsfiles/hass-weather-backgrounds/backgrounds/sunny.jpg",
  "clear-night": "/hacsfiles/hass-weather-backgrounds/backgrounds/night.jpg",
  partlycloudy: "/hacsfiles/hass-weather-backgrounds/backgrounds/partlycloudy.mp4",
  cloudy: "/hacsfiles/hass-weather-backgrounds/backgrounds/cloudy.jpg",
  rainy: "/hacsfiles/hass-weather-backgrounds/backgrounds/rainy.jpg",
  pouring: "/hacsfiles/hass-weather-backgrounds/backgrounds/pouring.jpg",
  lightning: "/hacsfiles/hass-weather-backgrounds/backgrounds/lightning.jpg",
  "lightning-rainy": "/hacsfiles/hass-weather-backgrounds/backgrounds/lightning-rainy.jpg",
  snowy: "/hacsfiles/hass-weather-backgrounds/backgrounds/snowy.jpg",
  "snowy-rainy": "/hacsfiles/hass-weather-backgrounds/backgrounds/snowy-rainy.jpg",
  fog: "/hacsfiles/hass-weather-backgrounds/backgrounds/fog.jpg",
  hail: "/hacsfiles/hass-weather-backgrounds/backgrounds/hail.jpg",
  windy: "/hacsfiles/hass-weather-backgrounds/backgrounds/windy.jpg",
  "windy-variant": "/hacsfiles/hass-weather-backgrounds/backgrounds/windy-variant.jpg",
  exceptional: "/hacsfiles/hass-weather-backgrounds/backgrounds/exceptional.jpg",
};

const DEFAULT_CONFIG = {
  entity: null,
  backgrounds: DEFAULT_BACKGROUNDS,
  effects: {},
  fallback: null,
  dashboards: null,
  style: "center / cover no-repeat",
  fixed: true,
};

const VIDEO_EXTENSIONS = [".mp4", ".webm", ".ogg"];

// ── Built-in effects ───────────────────────────────────────────────

const BUILT_IN_EFFECTS = {
  snowfall: (container) => {
    const canvas = document.createElement("canvas");
    Object.assign(canvas.style, {
      position: "fixed", top: "0", left: "0",
      width: "100vw", height: "100vh",
      pointerEvents: "none", zIndex: "0",
    });
    container.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    const flakes = [];
    const COUNT = 120;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < COUNT; i++) {
      flakes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 3 + 1,
        speed: Math.random() * 1.5 + 0.5,
        wind: Math.random() * 0.5 - 0.25,
        opacity: Math.random() * 0.6 + 0.4,
      });
    }

    let animId;
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const f of flakes) {
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${f.opacity})`;
        ctx.fill();
        f.y += f.speed;
        f.x += f.wind;
        if (f.y > canvas.height) { f.y = -5; f.x = Math.random() * canvas.width; }
        if (f.x > canvas.width) f.x = 0;
        if (f.x < 0) f.x = canvas.width;
      }
      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      canvas.remove();
    };
  },

  rain: (container) => {
    const canvas = document.createElement("canvas");
    Object.assign(canvas.style, {
      position: "fixed", top: "0", left: "0",
      width: "100vw", height: "100vh",
      pointerEvents: "none", zIndex: "0",
    });
    container.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    const drops = [];
    const COUNT = 200;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < COUNT; i++) {
      drops.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        len: Math.random() * 15 + 10,
        speed: Math.random() * 8 + 6,
        opacity: Math.random() * 0.3 + 0.1,
      });
    }

    let animId;
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "rgba(174, 194, 224, 0.5)";
      ctx.lineWidth = 1;
      for (const d of drops) {
        ctx.globalAlpha = d.opacity;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + 1, d.y + d.len);
        ctx.stroke();
        d.y += d.speed;
        d.x += 0.5;
        if (d.y > canvas.height) {
          d.y = -d.len;
          d.x = Math.random() * canvas.width;
        }
      }
      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      canvas.remove();
    };
  },

  lightning_flash: (container) => {
    const overlay = document.createElement("div");
    Object.assign(overlay.style, {
      position: "fixed", top: "0", left: "0",
      width: "100vw", height: "100vh",
      pointerEvents: "none", zIndex: "0",
      backgroundColor: "white", opacity: "0",
      transition: "opacity 0.1s",
    });
    container.appendChild(overlay);

    let timeout;
    function flash() {
      const delay = Math.random() * 8000 + 4000;
      timeout = setTimeout(() => {
        overlay.style.opacity = String(Math.random() * 0.3 + 0.1);
        setTimeout(() => {
          overlay.style.opacity = "0";
          setTimeout(() => {
            if (Math.random() > 0.5) {
              overlay.style.opacity = String(Math.random() * 0.15 + 0.05);
              setTimeout(() => { overlay.style.opacity = "0"; }, 80);
            }
          }, 100);
        }, 80);
        flash();
      }, delay);
    }
    flash();

    return () => {
      clearTimeout(timeout);
      overlay.remove();
    };
  },

  fog_drift: (container) => {
    const el = document.createElement("div");
    Object.assign(el.style, {
      position: "fixed", top: "0", left: "0",
      width: "200vw", height: "100vh",
      pointerEvents: "none", zIndex: "0",
      background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.08) 20%, rgba(255,255,255,0.15) 40%, rgba(255,255,255,0.08) 60%, rgba(255,255,255,0) 80%)",
      animation: "wb-fog-drift 30s linear infinite",
    });
    container.appendChild(el);

    const style = document.createElement("style");
    style.textContent = `
      @keyframes wb-fog-drift {
        0% { transform: translateX(-50%); }
        100% { transform: translateX(0%); }
      }
    `;
    container.appendChild(style);

    return () => {
      el.remove();
      style.remove();
    };
  },

  stars: (container) => {
    const canvas = document.createElement("canvas");
    Object.assign(canvas.style, {
      position: "fixed", top: "0", left: "0",
      width: "100vw", height: "100vh",
      pointerEvents: "none", zIndex: "0",
    });
    container.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    const stars = [];
    const COUNT = 150;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < COUNT; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.5,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        phase: Math.random() * Math.PI * 2,
      });
    }

    let animId;
    let t = 0;
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t += 1;
      for (const s of stars) {
        const opacity = 0.3 + 0.7 * Math.abs(Math.sin(t * s.twinkleSpeed + s.phase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fill();
      }
      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      canvas.remove();
    };
  },

  sun_rays: (container) => {
    const el = document.createElement("div");
    Object.assign(el.style, {
      position: "fixed", top: "-20%", right: "-10%",
      width: "60vw", height: "60vw",
      pointerEvents: "none", zIndex: "0",
      borderRadius: "50%",
      background: "radial-gradient(circle, rgba(255,236,170,0.25) 0%, rgba(255,200,50,0.08) 40%, transparent 70%)",
      animation: "wb-sun-pulse 8s ease-in-out infinite alternate",
    });
    container.appendChild(el);

    const style = document.createElement("style");
    style.textContent = `
      @keyframes wb-sun-pulse {
        0% { transform: scale(1); opacity: 0.6; }
        50% { transform: scale(1.15); opacity: 0.9; }
        100% { transform: scale(1.05); opacity: 0.7; }
      }
    `;
    container.appendChild(style);

    return () => { el.remove(); style.remove(); };
  },

  cloud_shadows: (container) => {
    const el1 = document.createElement("div");
    const el2 = document.createElement("div");
    const shared = {
      position: "fixed", top: "0", left: "0",
      width: "100vw", height: "100vh",
      pointerEvents: "none", zIndex: "0",
    };
    Object.assign(el1.style, {
      ...shared,
      background: "radial-gradient(ellipse 40% 30% at 30% 40%, rgba(0,0,0,0.12) 0%, transparent 70%)",
      animation: "wb-cloud-shadow-1 25s ease-in-out infinite alternate",
    });
    Object.assign(el2.style, {
      ...shared,
      background: "radial-gradient(ellipse 35% 25% at 60% 50%, rgba(0,0,0,0.08) 0%, transparent 70%)",
      animation: "wb-cloud-shadow-2 30s ease-in-out infinite alternate",
    });
    container.appendChild(el1);
    container.appendChild(el2);

    const style = document.createElement("style");
    style.textContent = `
      @keyframes wb-cloud-shadow-1 {
        0% { transform: translateX(-10%) translateY(0); }
        100% { transform: translateX(30%) translateY(5%); }
      }
      @keyframes wb-cloud-shadow-2 {
        0% { transform: translateX(20%) translateY(5%); }
        100% { transform: translateX(-15%) translateY(-3%); }
      }
    `;
    container.appendChild(style);

    return () => { el1.remove(); el2.remove(); style.remove(); };
  },

  warning_pulse: (container) => {
    const overlay = document.createElement("div");
    Object.assign(overlay.style, {
      position: "fixed", top: "0", left: "0",
      width: "100vw", height: "100vh",
      pointerEvents: "none", zIndex: "0",
      background: "radial-gradient(ellipse at center, rgba(255,60,0,0.12) 0%, rgba(200,0,0,0.06) 50%, transparent 80%)",
      animation: "wb-warning-pulse 4s ease-in-out infinite alternate",
    });
    container.appendChild(overlay);

    const style = document.createElement("style");
    style.textContent = `
      @keyframes wb-warning-pulse {
        0% { opacity: 0.3; }
        50% { opacity: 0.7; }
        100% { opacity: 0.4; }
      }
    `;
    container.appendChild(style);

    return () => { overlay.remove(); style.remove(); };
  },

  wind_streaks: (container) => {
    const canvas = document.createElement("canvas");
    Object.assign(canvas.style, {
      position: "fixed", top: "0", left: "0",
      width: "100vw", height: "100vh",
      pointerEvents: "none", zIndex: "0",
    });
    container.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    const streaks = [];
    const COUNT = 30;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < COUNT; i++) {
      streaks.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        len: Math.random() * 80 + 40,
        speed: Math.random() * 6 + 3,
        opacity: Math.random() * 0.08 + 0.02,
        width: Math.random() * 1.5 + 0.5,
      });
    }

    let animId;
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const s of streaks) {
        ctx.globalAlpha = s.opacity;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
        ctx.lineWidth = s.width;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x + s.len, s.y - 2);
        ctx.stroke();
        s.x += s.speed;
        if (s.x > canvas.width + s.len) {
          s.x = -s.len;
          s.y = Math.random() * canvas.height;
        }
      }
      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      canvas.remove();
    };
  },
};

// Default effects for weather states (use built-in names)
const DEFAULT_EFFECTS = {
  sunny: "sun_rays",
  "clear-night": "stars",
  partlycloudy: "cloud_shadows",
  cloudy: "cloud_shadows",
  fog: "fog_drift",
  rainy: "rain",
  pouring: "rain",
  lightning: "lightning_flash",
  "lightning-rainy": "lightning_flash",
  snowy: "snowfall",
  "snowy-rainy": "snowfall",
  hail: "rain",
  windy: "wind_streaks",
  "windy-variant": "wind_streaks",
  exceptional: "warning_pulse",
};

// ── DOM traversal helpers ──────────────────────────────────────────

function findHuiRoot() {
  return (
    document
      .querySelector("home-assistant")
      ?.shadowRoot?.querySelector("home-assistant-main")
      ?.shadowRoot?.querySelector("partial-panel-resolver")
      ?.querySelector("ha-panel-lovelace")
      ?.shadowRoot?.querySelector("hui-root") || null
  );
}

function findViewBackground() {
  return findHuiRoot()?.shadowRoot?.querySelector("hui-view-background") || null;
}

// ── Config resolution ──────────────────────────────────────────────

function getDashboardConfig() {
  try {
    const huiRoot = findHuiRoot();
    if (!huiRoot) return null;

    const lovelace = huiRoot.lovelace;
    if (!lovelace?.config?.views) return null;

    const curView = huiRoot._curView;
    if (curView === undefined || curView === "hass-unused-entities") return null;

    const viewConfig = lovelace.config.views[curView];
    const wb = viewConfig?.weather_backgrounds;
    if (wb === undefined) return null;
    if (wb === true || wb === null) return {};
    return wb;
  } catch {
    return null;
  }
}

function getConfig() {
  const dashConfig = getDashboardConfig() || {};
  const windowConfig = window.weatherBackgroundsConfig || {};

  return {
    ...DEFAULT_CONFIG,
    ...windowConfig,
    ...dashConfig,
    backgrounds: {
      ...DEFAULT_BACKGROUNDS,
      ...(windowConfig.backgrounds || {}),
      ...(dashConfig.backgrounds || {}),
    },
    effects: {
      ...DEFAULT_EFFECTS,
      ...(windowConfig.effects || {}),
      ...(dashConfig.effects || {}),
    },
  };
}

// ── Auto-discover weather entity ───────────────────────────────────

async function discoverWeatherEntity(hass) {
  const states = Object.keys(hass.states);
  const weatherEntities = states.filter((id) => id.startsWith("weather."));

  if (weatherEntities.length === 0) {
    console.warn("weather-backgrounds: No weather entities found");
    return null;
  }

  const preferred = ["weather.home", "weather.forecast_home"];
  for (const name of preferred) {
    if (weatherEntities.includes(name)) return name;
  }

  return weatherEntities[0];
}

// ── Background helpers ─────────────────────────────────────────────

function isVideo(path) {
  return VIDEO_EXTENSIONS.some((ext) => path.toLowerCase().endsWith(ext));
}

function getBackground(config, weather) {
  const bg = config.backgrounds[weather];
  if (!bg) {
    return config.fallback ? { type: "css", value: config.fallback } : null;
  }
  if (isVideo(bg)) {
    return { type: "video", src: bg };
  }
  if (
    bg.includes("gradient") ||
    bg.includes("rgb") ||
    bg.includes("#") ||
    !bg.includes("/")
  ) {
    return { type: "css", value: bg };
  }
  const fixed = config.fixed ? " fixed" : "";
  return { type: "css", value: `${config.style} url('${bg}')${fixed}` };
}

function isAllowedDashboard(config) {
  if (!config.dashboards) return true;
  const path = window.location.pathname;
  return config.dashboards.some((d) => path.startsWith(`/${d}`));
}

// ── Video background ───────────────────────────────────────────────

let _videoElement = null;

function removeVideoBackground() {
  if (_videoElement && _videoElement.parentNode) {
    _videoElement.parentNode.removeChild(_videoElement);
  }
  _videoElement = null;
}

function applyVideoBackground(root, src) {
  if (_videoElement && _videoElement.src.endsWith(src)) {
    return;
  }
  removeVideoBackground();

  const video = document.createElement("video");
  video.autoplay = true;
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.src = src;
  Object.assign(video.style, {
    position: "fixed", top: "0", left: "0",
    width: "100vw", height: "100vh",
    objectFit: "cover", zIndex: "-1",
    pointerEvents: "none",
  });

  _videoElement = video;
  const huiRootShadow = root.parentNode;
  if (huiRootShadow) {
    huiRootShadow.insertBefore(video, root);
  }
}

// ── Effects ────────────────────────────────────────────────────────

let _activeEffect = null;
let _activeEffectName = null;

function removeEffect() {
  if (_activeEffect) {
    _activeEffect();
    _activeEffect = null;
    _activeEffectName = null;
  }
}

function applyEffect(config, weather) {
  const effectName = config.effects[weather];

  // No effect for this weather
  if (!effectName) {
    removeEffect();
    return;
  }

  // Effect set to false/null = explicitly disabled
  if (effectName === false || effectName === "none") {
    removeEffect();
    return;
  }

  // Same effect already running
  if (_activeEffectName === effectName) return;

  removeEffect();

  // Resolve the effect function
  let effectFn;
  if (typeof effectName === "function") {
    effectFn = effectName;
  } else if (typeof effectName === "string") {
    if (BUILT_IN_EFFECTS[effectName]) {
      effectFn = BUILT_IN_EFFECTS[effectName];
    } else {
      console.warn(`weather-backgrounds: Unknown effect "${effectName}"`);
      return;
    }
  } else {
    return;
  }

  // Find a container to inject into
  const huiRoot = findHuiRoot();
  const container = huiRoot?.shadowRoot;
  if (!container) return;

  _activeEffectName = effectName;
  _activeEffect = effectFn(container);
}

// ── Apply all ──────────────────────────────────────────────────────

function applyBackground(root, bg) {
  if (!bg) {
    removeVideoBackground();
    root.style.removeProperty("--view-background");
    return;
  }

  if (bg.type === "video") {
    root.style.setProperty("--view-background", "transparent");
    applyVideoBackground(root, bg.src);
  } else {
    removeVideoBackground();
    root.style.setProperty("--view-background", bg.value);
  }
}

// ── Init ───────────────────────────────────────────────────────────

async function init() {
  const ha = document.querySelector("home-assistant");
  if (!ha) {
    setTimeout(init, 500);
    return;
  }

  let hass;
  while (!hass) {
    hass = ha?.hass;
    if (!hass) await new Promise((r) => setTimeout(r, 500));
  }

  let config = getConfig();

  let entity = config.entity;
  if (!entity) {
    entity = await discoverWeatherEntity(hass);
    if (!entity) return;
  }

  const template = `{% set weather = states('${entity}') %}{{ weather }}`;

  hass.connection.subscribeMessage(
    (result) => {
      const dashConfig = getDashboardConfig();
      if (!dashConfig) {
        const root = findViewBackground();
        if (root) applyBackground(root, null);
        removeEffect();
        return;
      }

      config = getConfig();
      if (!config.entity) config.entity = entity;

      if (!isAllowedDashboard(config)) {
        const root = findViewBackground();
        if (root) applyBackground(root, null);
        removeEffect();
        return;
      }

      const weather = result.result.trim();
      const bg = getBackground(config, weather);

      const root = findViewBackground();
      if (root) {
        applyBackground(root, bg);
      }

      applyEffect(config, weather);
    },
    {
      type: "render_template",
      template: template,
    }
  );

  console.info(
    "%c WEATHER-BACKGROUNDS ",
    "color: white; background: #4ecdc4; font-weight: bold;",
    `Loaded (entity: ${entity})`
  );
}

init();

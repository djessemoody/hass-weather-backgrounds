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
  entity: null, // null = auto-discover
  backgrounds: DEFAULT_BACKGROUNDS,
  fallback: null,
  dashboards: null,
  style: "center / cover no-repeat",
  fixed: true,
};

const VIDEO_EXTENSIONS = [".mp4", ".webm", ".ogg"];

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
  // Read weather_backgrounds from the current view's config in the dashboard YAML
  try {
    const huiRoot = findHuiRoot();
    if (!huiRoot) return null;

    const lovelace = huiRoot.lovelace;
    if (!lovelace?.config?.views) return null;

    // Find the current view index
    const curView = huiRoot._curView;
    if (curView === undefined || curView === "hass-unused-entities") return null;

    const viewConfig = lovelace.config.views[curView];
    return viewConfig?.weather_backgrounds || null;
  } catch {
    return null;
  }
}

function getConfig() {
  // Priority: dashboard YAML > window config > defaults
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

  // Prefer common names
  const preferred = [
    "weather.home",
    "weather.forecast_home",
  ];
  for (const name of preferred) {
    if (weatherEntities.includes(name)) return name;
  }

  // Fall back to first weather entity
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
    position: "fixed",
    top: "0",
    left: "0",
    width: "100vw",
    height: "100vh",
    objectFit: "cover",
    zIndex: "-1",
    pointerEvents: "none",
  });

  _videoElement = video;
  const huiRootShadow = root.parentNode;
  if (huiRootShadow) {
    huiRootShadow.insertBefore(video, root);
  }
}

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

  // Resolve config (may need to wait for hui-root to be ready)
  let config = getConfig();

  // Auto-discover entity if not configured
  let entity = config.entity;
  if (!entity) {
    entity = await discoverWeatherEntity(hass);
    if (!entity) return;
  }

  const template = `{% set weather = states('${entity}') %}{{ weather }}`;

  hass.connection.subscribeMessage(
    (result) => {
      // Re-read config on each update in case view changed
      config = getConfig();
      if (!config.entity) config.entity = entity;

      if (!isAllowedDashboard(config)) {
        // Clean up if we navigated away from an allowed dashboard
        const root = findViewBackground();
        if (root) applyBackground(root, null);
        return;
      }

      const weather = result.result.trim();
      const bg = getBackground(config, weather);

      const root = findViewBackground();
      if (root) {
        applyBackground(root, bg);
      }
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

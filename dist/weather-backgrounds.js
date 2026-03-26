/**
 * Weather Backgrounds for Home Assistant
 *
 * Dynamically sets the dashboard background based on a weather entity's state.
 * Uses Home Assistant's render_template WebSocket subscription for reactive updates.
 *
 * Configuration is set via window.weatherBackgroundsConfig before this script loads,
 * or defaults are used.
 */

const DEFAULT_CONFIG = {
  entity: "weather.home",
  backgrounds: {
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
  },
  // CSS value used when weather state has no matching background
  fallback: null,
  // Only apply on these dashboard paths (null = all dashboards)
  dashboards: null,
  // Background size/position (prepended to url())
  style: "center / cover no-repeat",
  // Whether to use "fixed" attachment
  fixed: true,
};

function getConfig() {
  const userConfig = window.weatherBackgroundsConfig || {};
  return {
    ...DEFAULT_CONFIG,
    ...userConfig,
    backgrounds: {
      ...DEFAULT_CONFIG.backgrounds,
      ...(userConfig.backgrounds || {}),
    },
  };
}

const VIDEO_EXTENSIONS = [".mp4", ".webm", ".ogg"];

function isVideo(path) {
  return VIDEO_EXTENSIONS.some((ext) => path.toLowerCase().endsWith(ext));
}

function getBackground(config, weather) {
  const bg = config.backgrounds[weather];
  if (!bg) {
    return config.fallback;
  }
  // Video files are handled separately via <video> element
  if (isVideo(bg)) {
    return { type: "video", src: bg };
  }
  // If the value looks like a CSS value already (contains gradient, color name, etc.), use as-is
  if (
    bg.includes("gradient") ||
    bg.includes("rgb") ||
    bg.includes("#") ||
    !bg.includes("/")
  ) {
    return { type: "css", value: bg };
  }
  // Otherwise treat as an image path
  const fixed = config.fixed ? " fixed" : "";
  return { type: "css", value: `${config.style} url('${bg}')${fixed}` };
}

function isAllowedDashboard(config) {
  if (!config.dashboards) return true;
  const path = window.location.pathname;
  return config.dashboards.some((d) => path.startsWith(`/${d}`));
}

let _videoElement = null;

function findViewBackground() {
  return (
    document
      .querySelector("home-assistant")
      ?.shadowRoot?.querySelector("home-assistant-main")
      ?.shadowRoot?.querySelector("partial-panel-resolver")
      ?.querySelector("ha-panel-lovelace")
      ?.shadowRoot?.querySelector("hui-root")
      ?.shadowRoot?.querySelector("hui-view-background") || null
  );
}

function removeVideoBackground() {
  if (_videoElement && _videoElement.parentNode) {
    _videoElement.parentNode.removeChild(_videoElement);
  }
  _videoElement = null;
}

function applyVideoBackground(root, src) {
  // Reuse existing video element if same source
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
  // Insert the video into the view background's parent (hui-root shadow)
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
    // Hide the CSS background and use video instead
    root.style.setProperty("--view-background", "transparent");
    applyVideoBackground(root, bg.src);
  } else {
    removeVideoBackground();
    root.style.setProperty("--view-background", bg.value);
  }
}

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

  const config = getConfig();
  const template = `{% set weather = states('${config.entity}') %}{{ weather }}`;

  hass.connection.subscribeMessage(
    (result) => {
      if (!isAllowedDashboard(config)) return;

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
}

init();

console.info(
  "%c WEATHER-BACKGROUNDS ",
  "color: white; background: #4ecdc4; font-weight: bold;",
  "Loaded"
);

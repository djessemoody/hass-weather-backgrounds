# Weather Backgrounds for Home Assistant

Dynamically changes your Home Assistant dashboard background based on the current weather. Uses weather entity state to swap between background images or CSS gradients, with reactive updates when the weather changes.

## Installation

### HACS (recommended)

1. Add this repository as a custom repository in HACS (category: Lovelace)
2. Install "Weather Backgrounds"
3. Add the resource in your Lovelace configuration

### Manual

1. Download `weather-backgrounds.js` from the latest release
2. Place it in `/config/www/`
3. Add as a Lovelace resource: `/local/weather-backgrounds.js` (type: module)

## Setup

### 1. Default backgrounds (no setup needed)

The plugin ships with default weather images that work out of the box. Just install and you'll have weather-reactive backgrounds immediately.

### 2. Custom backgrounds (optional)

To use your own images or videos, place them in `/config/www/backgrounds/` (or any path under `/config/www/`):

```
/config/www/backgrounds/
  sunny.jpg
  cloudy.jpg
  partlycloudy.jpg
  rainy.mp4          # Videos work too!
  snowy.jpg
  fog.jpg
  night.jpg
```

Supported formats:
- **Images**: `.jpg`, `.png`, `.webp`, `.gif`, or any CSS-compatible image
- **Videos**: `.mp4`, `.webm`, `.ogg` (autoplays muted and loops)
- **CSS values**: gradients, solid colors, or any valid CSS background value

Then configure the paths (see below).

### 3. Configure (optional)

Add configuration before the script loads by setting `window.weatherBackgroundsConfig` in your Lovelace resources or a separate script:

```yaml
# In your Lovelace resource list, add a module type resource that sets config:
# /local/weather-bg-config.js
```

```javascript
// weather-bg-config.js
window.weatherBackgroundsConfig = {
  // Weather entity to watch (default: "weather.home")
  entity: "weather.my_station",

  // Map weather states to backgrounds
  // Values can be image paths, video paths, or CSS values
  backgrounds: {
    sunny: "/local/backgrounds/sunny.jpg",
    "clear-night": "/local/backgrounds/night.jpg",
    partlycloudy: "/local/backgrounds/partlycloudy.jpg",
    cloudy: "/local/backgrounds/cloudy.jpg",
    rainy: "/local/backgrounds/rainy.mp4",   // Videos autoplay muted and loop
    snowy: "/local/backgrounds/snowy.jpg",
    fog: "/local/backgrounds/fog.jpg",
    // CSS values work too:
    // sunny: "linear-gradient(-45deg, #1a6dd4, #56b4d3, #f0c27f, #4ecdc4)",
  },

  // Only apply on specific dashboards (null = all)
  dashboards: ["ha-kiosk", "lovelace"],

  // Background CSS (default: "center / cover no-repeat")
  style: "center / cover no-repeat",

  // Use fixed attachment (default: true)
  fixed: true,

  // Fallback when weather state has no match (null = don't change background)
  fallback: null,
};
```

Make sure the config script is loaded **before** `weather-backgrounds.js` in your Lovelace resources.

## How it works

The plugin subscribes to Home Assistant's `render_template` WebSocket API to watch a weather entity's state. When the state changes, it updates the `--view-background` CSS variable on the `hui-view-background` element, which controls the dashboard background.

No card-mod or other dependencies required.

## Compatibility

- Home Assistant 2024.0.0+
- Works with all view types (sections, masonry, panel, sidebar)

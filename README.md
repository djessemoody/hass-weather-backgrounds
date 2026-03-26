# Weather Backgrounds for Home Assistant

Dynamically changes your Home Assistant dashboard background based on the current weather. Ships with default images for all 15 weather conditions, supports images, videos, and CSS gradients.

Works out of the box with zero configuration.

## Installation

### HACS (recommended)

1. Add this repository as a custom repository in HACS (category: Dashboard)
2. Install "Weather Backgrounds"
3. Add the resource in your Lovelace configuration
4. Restart Home Assistant

### Manual

1. Download the `dist/` folder from the latest release
2. Place it in `/config/www/weather-backgrounds/`
3. Add as a Lovelace resource: `/local/weather-backgrounds/weather-backgrounds.js` (type: module)

## How it works

The plugin automatically finds your weather entity and subscribes to state changes. When the weather changes, the dashboard background updates to match. No card-mod or other dependencies required.

## Default backgrounds

The plugin ships with backgrounds for all 15 Home Assistant weather conditions. Just install and it works immediately:

sunny, clear-night, partlycloudy (video), cloudy, fog, rainy, pouring, lightning, lightning-rainy, snowy, snowy-rainy, hail, windy, windy-variant, exceptional

## Configuration

### Zero config (default)

The plugin auto-discovers the first `weather.*` entity in your system. If you only have one weather integration, no configuration is needed.

### Dashboard YAML

Add a `weather_backgrounds` key to your view config:

```yaml
views:
  - title: Home
    weather_backgrounds:
      entity: weather.my_station
```

Full options:

```yaml
views:
  - title: Home
    weather_backgrounds:
      # Weather entity to watch
      entity: weather.my_station

      # Override specific backgrounds (images, videos, or CSS values)
      backgrounds:
        sunny: /local/my-backgrounds/sunny.jpg
        rainy: /local/my-backgrounds/rain.mp4
        cloudy: "linear-gradient(-45deg, #4a5568, #718096)"

      # Only apply on specific dashboards (omit for all)
      dashboards:
        - ha-kiosk
        - lovelace

      # Background CSS positioning (default: "center / cover no-repeat")
      style: "center / cover no-repeat"

      # Fixed attachment - background stays put when scrolling (default: true)
      fixed: true
```

### Custom media

Place your own images or videos anywhere under `/config/www/` and reference them in the config:

```yaml
weather_backgrounds:
  backgrounds:
    sunny: /local/backgrounds/my-sunny.jpg
    rainy: /local/backgrounds/rain-loop.mp4
```

Supported formats:
- **Images**: `.jpg`, `.png`, `.webp`, `.gif`
- **Videos**: `.mp4`, `.webm`, `.ogg` (autoplays muted and loops)
- **CSS values**: gradients, solid colors, any valid CSS background

## Compatibility

- Home Assistant 2024.0.0+
- Works with all view types (sections, masonry, panel, sidebar)
- No dependencies (no card-mod needed)

## Credits

Default background media sourced from [Unsplash](https://unsplash.com) and [Pexels](https://www.pexels.com). See `dist/backgrounds/CREDITS.md` for details.

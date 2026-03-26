# Weather Backgrounds for Home Assistant

Dynamically changes your Home Assistant dashboard background based on the current weather. Ships with default images for all 15 weather conditions, supports images, videos, and CSS gradients.

Add `weather_backgrounds:` to any dashboard view to enable it.

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

### Enable on a dashboard

Add `weather_backgrounds:` to your view config to enable it. The plugin auto-discovers your weather entity:

```yaml
views:
  - title: Home
    weather_backgrounds:
```

That's it — auto-discovers your weather entity and uses the default images.

### Customize:

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

## Effects

Weather effects are enabled by default for matching weather states. Built-in effects:

| Effect | Default for | Description |
|--------|------------|-------------|
| `sun_rays` | sunny | Warm pulsing sun glow |
| `stars` | clear-night | Twinkling stars |
| `cloud_shadows` | partlycloudy, cloudy | Drifting cloud shadows |
| `fog_drift` | fog | Slow-moving fog layer |
| `rain` | rainy, pouring, hail | Angled rain streaks |
| `lightning_flash` | lightning, lightning-rainy | Random lightning flashes |
| `snowfall` | snowy, snowy-rainy | Falling snowflakes |
| `wind_streaks` | windy, windy-variant | Horizontal wind lines |
| `warning_pulse` | exceptional | Pulsing red/orange warning glow |

### Override or disable effects

```yaml
weather_backgrounds:
  effects:
    # Use a different built-in effect
    cloudy: fog_drift
    # Disable effect for a state
    rainy: none
    # Disable all effects
    snowy: none
    sunny: none
```

## Compatibility

- Home Assistant 2024.0.0+
- Works with all view types (sections, masonry, panel, sidebar)
- No dependencies (no card-mod needed)

## Credits

Default background media sourced from [Unsplash](https://unsplash.com) and [Pexels](https://www.pexels.com). See `dist/backgrounds/CREDITS.md` for details.

# Cardio Slot visual direction

## Concept

A treadmill console meets a thermal race ticket. The machine is quiet and
instrumental; the pull, reel stop, and ticket print are the single orchestrated
moment of delight.

## Tokens

### Track

- Cinder `#181713`
- Chalk `#F4F0E6`
- Signal red `#E8442E`
- Track clay `#B84A36`
- Moss `#63705A`

### Neon

- Night `#07131E`
- Screen `#D8FBFF`
- Electric cyan `#37E6F6`
- Pulse magenta `#FF4FA7`
- Deep blue `#12364A`

### Mono

- Carbon `#171717`
- Paper `#F3F1EA`
- Graphite `#5B5B56`
- Mid grey `#A7A49B`
- White `#FFFFFF`

Barlow Condensed is the athletic display face. IBM Plex Mono is reserved for
readouts, ticket metadata, and controls.

## Layout

Desktop uses a centered machine shell with configuration at left and the
working console/ticket at right. Mobile collapses to one focused column with
the primary action always reachable.

```text
┌─────────────────────────────────────────────┐
│ CARDIO SLOT                     install/help │
├─────────────────┬───────────────────────────┤
│ duration / skin │  [ FOCUS PATTERN FINISH ] │
│ safety note     │          PULL             │
│                 │       printed ticket      │
└─────────────────┴───────────────────────────┘
```

## Interaction principles

- Use borders, perforations, progress rails, and physical controls as real
  structure, not ornament.
- Keep body copy sentence case and concise; machine labels may use restrained
  uppercase where the real-world console metaphor requires it.
- All controls have at least a 48px target, visible focus, 4.5:1 body contrast,
  and reduced-motion alternatives.
- No decorative gradients, floating SaaS cards, or incidental entrance motion.

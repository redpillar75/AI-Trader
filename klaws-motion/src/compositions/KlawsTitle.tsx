import React from 'react'
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
} from 'remotion'

const GOLD = '#C9A84C'
const RED = '#CC0000'
const WHITE = '#FFFFFF'
const BLACK = '#0A0A0A'

const KineticLetter: React.FC<{
  char: string
  index: number
  totalDelay: number
  color: string
  fontSize: number
}> = ({ char, index, totalDelay, color, fontSize }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const delay = totalDelay + index * 2

  const opacity = interpolate(frame, [delay, delay + 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const y = interpolate(frame, [delay, delay + 14], [30, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <span
      style={{
        opacity,
        transform: `translateY(${y}px)`,
        display: 'inline-block',
        color,
        fontSize,
        fontWeight: 900,
        fontFamily: '"Arial Black", "Impact", sans-serif',
        letterSpacing: char === ' ' ? '0.2em' : '0.05em',
        textTransform: 'uppercase',
      }}
    >
      {char === ' ' ? ' ' : char}
    </span>
  )
}

const GlowLine: React.FC<{ delay: number; color: string }> = ({ delay, color }) => {
  const frame = useCurrentFrame()

  const width = interpolate(frame, [delay, delay + 25], [0, 700], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const opacity = interpolate(frame, [delay, delay + 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <div
      style={{
        width,
        height: 3,
        background: `linear-gradient(90deg, ${color}, transparent)`,
        opacity,
        boxShadow: `0 0 12px ${color}, 0 0 24px ${color}40`,
      }}
    />
  )
}

const PulseCircle: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const scale = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: { damping: 12, stiffness: 180, mass: 0.6 },
  })
  const opacity = interpolate(frame, [delay, delay + 8, delay + 40, delay + 60], [0, 0.3, 0.3, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <div
      style={{
        position: 'absolute',
        width: 600,
        height: 600,
        borderRadius: '50%',
        border: `2px solid ${GOLD}`,
        transform: `scale(${scale})`,
        opacity,
      }}
    />
  )
}

export const KlawsTitle: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const bgOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' })

  // Scan line flicker
  const scanOpacity = interpolate(
    Math.sin(frame * 0.4),
    [-1, 1],
    [0.02, 0.06]
  )

  // Overall fade out at end
  const fadeOut = interpolate(frame, [110, 130], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const klawsText = 'K.L.A.W.S'
  const newYorkText = 'NEW YORK'

  return (
    <AbsoluteFill
      style={{
        background: BLACK,
        opacity: bgOpacity * fadeOut,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Scan lines overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
          opacity: scanOpacity,
          pointerEvents: 'none',
        }}
      />

      {/* Pulse rings */}
      <PulseCircle delay={5} />
      <PulseCircle delay={25} />

      {/* Corner accents */}
      <div style={{ position: 'absolute', top: 60, left: 60, width: 40, height: 40, borderTop: `3px solid ${GOLD}`, borderLeft: `3px solid ${GOLD}`, opacity: interpolate(frame, [10, 25], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }} />
      <div style={{ position: 'absolute', top: 60, right: 60, width: 40, height: 40, borderTop: `3px solid ${GOLD}`, borderRight: `3px solid ${GOLD}`, opacity: interpolate(frame, [10, 25], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }} />
      <div style={{ position: 'absolute', bottom: 60, left: 60, width: 40, height: 40, borderBottom: `3px solid ${GOLD}`, borderLeft: `3px solid ${GOLD}`, opacity: interpolate(frame, [10, 25], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }} />
      <div style={{ position: 'absolute', bottom: 60, right: 60, width: 40, height: 40, borderBottom: `3px solid ${GOLD}`, borderRight: `3px solid ${GOLD}`, opacity: interpolate(frame, [10, 25], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }} />

      {/* Main content */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>

        {/* Top accent line */}
        <GlowLine delay={5} color={RED} />

        {/* K.L.A.W.S — main title */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {klawsText.split('').map((char, i) => (
            <KineticLetter
              key={i}
              char={char}
              index={i}
              totalDelay={8}
              color={WHITE}
              fontSize={160}
            />
          ))}
        </div>

        {/* Gold divider line */}
        <GlowLine delay={30} color={GOLD} />

        {/* NEW YORK — subtitle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {newYorkText.split('').map((char, i) => (
            <KineticLetter
              key={i}
              char={char}
              index={i}
              totalDelay={40}
              color={GOLD}
              fontSize={72}
            />
          ))}
        </div>

        {/* Bottom accent line */}
        <GlowLine delay={55} color={RED} />
      </div>
    </AbsoluteFill>
  )
}

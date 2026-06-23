import React from 'react'
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion'

const GOLD = '#C9A84C'
const RED = '#CC0000'
const BLACK = '#0A0A0A'
const WHITE = '#FFFFFF'

export const KlawsCountdown: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()

  // 5-second countdown from 5 to 0
  const totalSeconds = 5
  const secondsLeft = Math.ceil((durationInFrames - frame) / fps)
  const currentSecond = Math.min(totalSeconds, Math.max(0, secondsLeft))

  // Flash on each new second
  const secondFrame = frame % fps
  const flashOpacity = interpolate(secondFrame, [0, 8], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // Circular progress
  const progress = frame / durationInFrames
  const circumference = 2 * Math.PI * 200
  const strokeDashoffset = circumference * (1 - progress)

  // Number scale pop on each second
  const numScale = spring({
    frame: secondFrame,
    fps,
    config: { damping: 10, stiffness: 300, mass: 0.4 },
  })

  const bgOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' })
  const fadeOut = interpolate(frame, [durationInFrames - 15, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <AbsoluteFill
      style={{
        background: BLACK,
        opacity: bgOpacity * fadeOut,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Flash overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: WHITE,
          opacity: flashOpacity * 0.06,
        }}
      />

      {/* SVG circle progress */}
      <svg
        width={500}
        height={500}
        style={{ position: 'absolute' }}
      >
        {/* Background circle */}
        <circle cx={250} cy={250} r={200} fill="none" stroke="#1a1a1a" strokeWidth={6} />
        {/* Progress arc */}
        <circle
          cx={250}
          cy={250}
          r={200}
          fill="none"
          stroke={GOLD}
          strokeWidth={4}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 250 250)"
          style={{ filter: `drop-shadow(0 0 8px ${GOLD})` }}
        />
        {/* Red accent ticks */}
        {[0, 72, 144, 216, 288].map((angle, i) => (
          <line
            key={i}
            x1={250 + 210 * Math.cos((angle - 90) * Math.PI / 180)}
            y1={250 + 210 * Math.sin((angle - 90) * Math.PI / 180)}
            x2={250 + 225 * Math.cos((angle - 90) * Math.PI / 180)}
            y2={250 + 225 * Math.sin((angle - 90) * Math.PI / 180)}
            stroke={RED}
            strokeWidth={3}
          />
        ))}
      </svg>

      {/* Center number */}
      <div
        style={{
          fontSize: 200,
          fontWeight: 900,
          fontFamily: '"Arial Black", Impact, sans-serif',
          color: WHITE,
          transform: `scale(${numScale})`,
          lineHeight: 1,
          textShadow: `0 0 40px rgba(255,255,255,0.2)`,
        }}
      >
        {currentSecond}
      </div>

      {/* K.L.A.W.S label */}
      <div
        style={{
          position: 'absolute',
          bottom: 140,
          fontSize: 28,
          fontWeight: 900,
          fontFamily: '"Arial Black", Impact, sans-serif',
          color: GOLD,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
        }}
      >
        K.L.A.W.S — NEW YORK
      </div>
    </AbsoluteFill>
  )
}

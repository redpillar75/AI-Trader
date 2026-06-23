import React from 'react'
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
} from 'remotion'

const GOLD = '#C9A84C'
const RED = '#CC0000'
const WHITE = '#FFFFFF'

export const KlawsLowerThird: React.FC<{
  name?: string
  title?: string
}> = ({
  name = 'K.L.A.W.S',
  title = 'NEW YORK',
}) => {
  const frame = useCurrentFrame()

  // Slide in from left
  const x = interpolate(frame, [0, 18], [-700, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // Slide out to left
  const exitX = interpolate(frame, [75, 90], [0, -700], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const translateX = frame < 75 ? x : exitX

  // Red accent bar grows in
  const barHeight = interpolate(frame, [5, 20], [0, 70], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // Text fade
  const nameOpacity = interpolate(frame, [12, 25], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const titleOpacity = interpolate(frame, [20, 32], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // Gold underline grows
  const lineWidth = interpolate(frame, [25, 45], [0, 300], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          bottom: 100,
          left: 80,
          transform: `translateX(${translateX}px)`,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 0,
        }}
      >
        {/* Red left bar */}
        <div
          style={{
            width: 6,
            height: barHeight,
            background: RED,
            boxShadow: `0 0 10px ${RED}`,
            marginRight: 16,
          }}
        />

        {/* Text block */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Name */}
          <div
            style={{
              opacity: nameOpacity,
              color: WHITE,
              fontSize: 38,
              fontWeight: 900,
              fontFamily: '"Arial Black", Impact, sans-serif',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              textShadow: `0 0 20px rgba(255,255,255,0.3)`,
            }}
          >
            {name}
          </div>

          {/* Gold underline */}
          <div
            style={{
              width: lineWidth,
              height: 2,
              background: `linear-gradient(90deg, ${GOLD}, transparent)`,
              boxShadow: `0 0 8px ${GOLD}`,
            }}
          />

          {/* Title */}
          <div
            style={{
              opacity: titleOpacity,
              color: GOLD,
              fontSize: 22,
              fontWeight: 600,
              fontFamily: 'Arial, sans-serif',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
            }}
          >
            {title}
          </div>
        </div>

        {/* Black background plate */}
        <div
          style={{
            position: 'absolute',
            inset: -12,
            background: 'rgba(0,0,0,0.75)',
            zIndex: -1,
            backdropFilter: 'blur(4px)',
          }}
        />
      </div>
    </AbsoluteFill>
  )
}

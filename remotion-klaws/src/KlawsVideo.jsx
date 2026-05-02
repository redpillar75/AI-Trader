import { useCurrentFrame, useVideoConfig, interpolate, spring, AbsoluteFill } from "remotion";
import { VendingMachine } from "./VendingMachine";
import { Title3D, SubTitle3D } from "./Title3D";
import { Particles, Sparkles } from "./Particles";

// Scene 1 frames 0-59:  Title intro
// Scene 2 frames 60-239: Vending machine claw action
// Scene 3 frames 240-299: Big win outro

const Scene1 = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const bgPulse = interpolate(frame % 60, [0, 30, 60], [0, 1, 0]);

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 50% 40%, #3b0080 0%, #1a0033 50%, #0a0015 100%)`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 24,
    }}>
      {/* Animated ring */}
      <div style={{
        position: "absolute",
        width: 500,
        height: 500,
        borderRadius: "50%",
        border: `4px solid rgba(168, 85, 247, ${0.3 + bgPulse * 0.4})`,
        boxShadow: `0 0 ${60 + bgPulse * 40}px rgba(168, 85, 247, 0.4)`,
      }} />
      <div style={{
        position: "absolute",
        width: 650,
        height: 650,
        borderRadius: "50%",
        border: `2px solid rgba(168, 85, 247, ${0.15 + bgPulse * 0.2})`,
      }} />

      <Particles count={25} color="rainbow" />

      <Title3D text="KLAWS 72" startFrame={0} />
      <SubTitle3D text="Grab The Treasure" startFrame={20} color="#ffd700" />
      <SubTitle3D text="Coins · Gold · Gems" startFrame={35} color="#a855f7" />

      {/* Claw icon hint */}
      <div style={{
        marginTop: 20,
        opacity: interpolate(frame, [40, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        fontSize: 52,
        filter: "drop-shadow(0 0 20px #ffd700)",
      }}>
        🎰
      </div>
    </AbsoluteFill>
  );
};

const Scene2 = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      <VendingMachine />
      {/* Score counter */}
      <ScoreCounter />
    </AbsoluteFill>
  );
};

const ScoreCounter = () => {
  const frame = useCurrentFrame();
  const score = Math.min(frame * 3, 999);
  const pulse = spring({ frame: frame - 95, fps: 30, config: { damping: 8, stiffness: 200 } });

  return (
    <div style={{
      position: "absolute",
      top: 24,
      right: 32,
      fontFamily: "'Arial Black', sans-serif",
      fontWeight: 900,
      fontSize: 28,
      color: "#ffd700",
      textShadow: "0 0 16px #ffd700, 2px 2px 0 #000",
      transform: `scale(${0.8 + pulse * 0.2})`,
      opacity: interpolate(frame, [0, 15], [0, 1]),
    }}>
      ★ {String(score).padStart(3, "0")}
    </div>
  );
};

const Scene3 = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const bigScale = spring({ frame, fps: 30, config: { damping: 12, stiffness: 60 } });
  const shimmer = interpolate(frame % 30, [0, 15, 30], [0.8, 1.3, 0.8]);

  return (
    <AbsoluteFill style={{
      background: "radial-gradient(ellipse at 50% 50%, #2d0060 0%, #0a0015 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 20,
    }}>
      <Particles count={50} color="rainbow" />

      {/* WIN burst */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * 360;
        const len = 180 + (i % 3) * 40;
        return (
          <div key={i} style={{
            position: "absolute",
            width: 4,
            height: len,
            background: `linear-gradient(0deg, transparent, hsl(${i * 45}, 100%, 65%))`,
            transformOrigin: "bottom center",
            bottom: height / 2,
            left: width / 2 - 2,
            transform: `rotate(${angle + frame * 0.8}deg)`,
            opacity: 0.6,
          }} />
        );
      })}

      {/* Big WIN text */}
      <div style={{
        fontFamily: "'Arial Black', sans-serif",
        fontWeight: 900,
        fontSize: 140,
        color: "#ffd700",
        textShadow: `
          4px 4px 0 #b8860b,
          8px 8px 0 #7a5800,
          12px 12px 0 #3d2c00,
          0 0 ${40 * shimmer}px #ffd700,
          0 0 ${80 * shimmer}px #ffd70066
        `,
        transform: `scale(${bigScale})`,
        WebkitTextStroke: "3px #b8860b",
        letterSpacing: 8,
      }}>
        WIN!
      </div>

      {/* Treasure icons */}
      <div style={{
        display: "flex",
        gap: 24,
        fontSize: 56,
        filter: `drop-shadow(0 0 ${12 * shimmer}px #ffd700)`,
        transform: `scale(${bigScale})`,
      }}>
        🪙 💰 🏆 💎 🥇
      </div>

      <SubTitle3D text="KLAWS 72 STRIKES AGAIN" startFrame={10} color="#a855f7" />

      {/* Sparkle bursts */}
      <Sparkles x={width * 0.2} y={height * 0.3} frame={5} count={16} />
      <Sparkles x={width * 0.8} y={height * 0.3} frame={8} count={16} />
      <Sparkles x={width * 0.5} y={height * 0.7} frame={12} count={20} />
    </AbsoluteFill>
  );
};

export const KlawsVideo = () => {
  const frame = useCurrentFrame();

  if (frame < 60) {
    return <Scene1 />;
  } else if (frame < 240) {
    return (
      <AbsoluteFill>
        <Scene2 />
        {/* Scene label */}
        <div style={{
          position: "absolute",
          top: 24,
          left: 32,
          fontFamily: "'Arial Black', sans-serif",
          fontWeight: 900,
          fontSize: 20,
          color: "#a855f7",
          textShadow: "0 0 12px #a855f7, 1px 1px 0 #000",
          opacity: interpolate(frame, [60, 75], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          letterSpacing: 3,
        }}>
          KLAWS 72
        </div>
      </AbsoluteFill>
    );
  } else {
    return <Scene3 />;
  }
};

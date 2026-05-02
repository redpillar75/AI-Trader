import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

// Coin component
const Coin = ({ x, y, delay, size = 28 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame: frame - delay, fps, config: { damping: 12, stiffness: 80 } });
  const fall = interpolate(frame - delay, [0, 60], [y - 120, y], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const spin = interpolate(frame, [0, 120], [0, 720]);
  const opacity = interpolate(frame - delay, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <div style={{
      position: "absolute",
      left: x,
      top: fall,
      opacity,
      transform: `rotateY(${spin}deg) scale(${progress})`,
      width: size,
      height: size,
      borderRadius: "50%",
      background: "radial-gradient(circle at 35% 35%, #ffe066, #ffd700, #b8860b)",
      boxShadow: "0 0 12px #ffd70099, inset 0 0 8px #fff5",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: size * 0.45,
      fontWeight: 900,
      color: "#b8860b",
      border: "2px solid #ffd700",
    }}>
      $
    </div>
  );
};

// Gold bar component
const GoldBar = ({ x, y, delay, rotation = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 60 } });
  const fall = interpolate(frame - delay, [0, 50], [y - 100, y], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const opacity = interpolate(frame - delay, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const wobble = interpolate(frame - delay, [0, 20, 40, 60], [rotation - 15, rotation + 10, rotation - 5, rotation], { extrapolateRight: "clamp" });

  return (
    <div style={{
      position: "absolute",
      left: x,
      top: fall,
      opacity,
      transform: `rotate(${wobble}deg) scale(${progress})`,
      width: 64,
      height: 32,
      background: "linear-gradient(135deg, #ffe066 0%, #ffd700 40%, #b8860b 70%, #ffd700 100%)",
      borderRadius: 6,
      boxShadow: "0 4px 18px #ffd70088, inset 0 2px 4px #fff6",
      border: "2px solid #b8860b",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 11,
      fontWeight: 900,
      color: "#7a5800",
      letterSpacing: 1,
    }}>
      GOLD
    </div>
  );
};

// Gem component
const Gem = ({ x, y, delay, color = "#a855f7" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame: frame - delay, fps, config: { damping: 10, stiffness: 70 } });
  const fall = interpolate(frame - delay, [0, 55], [y - 90, y], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const opacity = interpolate(frame - delay, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const glow = interpolate(frame, [0, 30, 60], [0.6, 1.2, 0.6], { extrapolateRight: "extend" });

  return (
    <div style={{
      position: "absolute",
      left: x,
      top: fall,
      opacity,
      transform: `scale(${progress})`,
      width: 30,
      height: 30,
      background: color,
      clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)",
      filter: `drop-shadow(0 0 ${8 * glow}px ${color})`,
      transition: "filter 0.1s",
    }} />
  );
};

// The claw
const Claw = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase 1 (0-40): claw descends
  // Phase 2 (40-70): claw grabs (closes)
  // Phase 3 (70-120): claw rises with treasure
  // Phase 4 (120-160): claw swings to center, drops loot

  const descend = interpolate(frame, [0, 45], [0, 260], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const rise = interpolate(frame, [70, 115], [260, -10], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const clawY = frame < 70 ? descend : rise;

  const clawX = interpolate(frame, [0, 30, 110, 160], [260, 260, 260, 420], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const grabProgress = spring({ frame: frame - 42, fps, config: { damping: 16, stiffness: 120 } });
  const clawOpen = frame < 42 ? 22 : interpolate(grabProgress, [0, 1], [22, 5]);

  const swingAngle = interpolate(frame, [110, 155], [0, 12], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const ropeLen = clawY + 30;

  return (
    <g transform={`translate(${clawX}, 0) rotate(${swingAngle}, 0, 0)`}>
      {/* Rope */}
      <rect x={-2} y={0} width={4} height={ropeLen > 0 ? ropeLen : 0} fill="#888" rx={2} />
      {/* Claw body */}
      <g transform={`translate(0, ${clawY})`}>
        <rect x={-18} y={0} width={36} height={14} rx={5} fill="#555" />
        {/* Left arm */}
        <line x1={-10} y1={14} x2={-clawOpen} y2={38} stroke="#444" strokeWidth={5} strokeLinecap="round" />
        {/* Right arm */}
        <line x1={10} y1={14} x2={clawOpen} y2={38} stroke="#444" strokeWidth={5} strokeLinecap="round" />
        {/* Left tip */}
        <line x1={-clawOpen} y1={38} x2={-clawOpen + 6} y2={52} stroke="#444" strokeWidth={5} strokeLinecap="round" />
        {/* Right tip */}
        <line x1={clawOpen} y1={38} x2={clawOpen - 6} y2={52} stroke="#444" strokeWidth={5} strokeLinecap="round" />
        {/* Glow */}
        <ellipse cx={0} cy={26} rx={clawOpen + 6} ry={14} fill="none" stroke="#00eaff44" strokeWidth={3} />
      </g>
    </g>
  );
};

// Machine glass reflection
const GlassSheen = () => (
  <>
    <div style={{
      position: "absolute", top: 10, left: "12%", width: "6%", height: "70%",
      background: "linear-gradient(180deg, #ffffff22 0%, #ffffff08 100%)",
      borderRadius: 8, pointerEvents: "none",
    }} />
    <div style={{
      position: "absolute", top: 10, left: "20%", width: "3%", height: "55%",
      background: "linear-gradient(180deg, #ffffff18 0%, transparent 100%)",
      borderRadius: 4, pointerEvents: "none",
    }} />
  </>
);

export const VendingMachine = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Treasure pile visible after claw drops (frame ~155)
  const lootOpacity = interpolate(frame, [150, 165], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Flicker lights
  const lightGlow = interpolate(frame % 40, [0, 20, 40], [0.7, 1.3, 0.7]);

  return (
    <div style={{ position: "relative", width, height }}>

      {/* BG gradient */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 50% 30%, #1a0a2e 0%, #0a0015 100%)",
      }} />

      {/* Stars */}
      {Array.from({ length: 40 }).map((_, i) => {
        const sx = (((i * 173) % 100) / 100) * width;
        const sy = (((i * 97) % 80) / 100) * height;
        const twinkle = interpolate((frame + i * 7) % 60, [0, 30, 60], [0.2, 1, 0.2]);
        return <div key={i} style={{
          position: "absolute", left: sx, top: sy,
          width: 2 + (i % 3), height: 2 + (i % 3),
          borderRadius: "50%", background: "#fff",
          opacity: twinkle,
        }} />;
      })}

      {/* Machine body */}
      <div style={{
        position: "absolute",
        left: "14%", top: "8%",
        width: "72%", height: "82%",
        background: "linear-gradient(160deg, #1e0533 0%, #2d0b4e 40%, #1a0033 100%)",
        borderRadius: 28,
        border: "3px solid #7c3aed",
        boxShadow: `0 0 60px #7c3aed66, 0 0 120px #7c3aed33, inset 0 0 40px #00000066`,
      }}>

        {/* Top header bar */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 60,
          background: "linear-gradient(90deg, #7c3aed, #a855f7, #7c3aed)",
          borderRadius: "25px 25px 0 0",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 0 30px #a855f7${Math.round(lightGlow * 99).toString(16).padStart(2, "0")}`,
        }}>
          <div style={{
            fontFamily: "'Arial Black', sans-serif",
            fontWeight: 900, fontSize: 26,
            color: "#ffe066",
            textShadow: "0 0 16px #ffd700, 0 0 32px #ffd700",
            letterSpacing: 4,
          }}>
            ★ KLAWS 72 ★
          </div>
        </div>

        {/* Glass window */}
        <div style={{
          position: "absolute",
          top: 70, left: "8%",
          width: "84%", height: "62%",
          background: "linear-gradient(135deg, #0a001888 0%, #1a003388 60%, #0a001888 100%)",
          borderRadius: 16,
          border: "2px solid #a855f755",
          overflow: "hidden",
          boxShadow: "inset 0 0 30px #7c3aed44",
        }}>
          <GlassSheen />

          {/* Treasure pile background */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: 110,
            background: "radial-gradient(ellipse at 50% 100%, #7a5800 0%, #3d2a00 60%, transparent 100%)",
            opacity: 0.7,
          }} />

          {/* Static treasure items in pile */}
          {[
            { x: "8%", color: "#ffd700" }, { x: "18%", color: "#ff4444" },
            { x: "30%", color: "#00e5ff" }, { x: "52%", color: "#ffd700" },
            { x: "62%", color: "#39ff14" }, { x: "74%", color: "#ff69b4" },
            { x: "84%", color: "#ffd700" },
          ].map((g, i) => (
            <div key={i} style={{
              position: "absolute", bottom: 18 + (i % 3) * 14, left: g.x,
              width: 22, height: 22,
              background: g.color,
              clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)",
              filter: `drop-shadow(0 0 6px ${g.color})`,
              opacity: 0.9,
            }} />
          ))}
          {[{ x: "14%", r: -8 }, { x: "35%", r: 5 }, { x: "56%", r: -12 }, { x: "75%", r: 7 }].map((b, i) => (
            <div key={i} style={{
              position: "absolute", bottom: 8 + (i % 2) * 10, left: b.x,
              width: 52, height: 26,
              background: "linear-gradient(135deg, #ffe066, #ffd700, #b8860b)",
              borderRadius: 5,
              border: "1.5px solid #b8860b",
              transform: `rotate(${b.r}deg)`,
              boxShadow: "0 2px 10px #ffd70066",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 9, fontWeight: 900, color: "#7a5800",
            }}>GOLD</div>
          ))}
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{
              position: "absolute",
              bottom: 4 + (i % 4) * 16,
              left: `${8 + (i * 8) % 82}%`,
              width: 20, height: 20, borderRadius: "50%",
              background: "radial-gradient(circle at 35% 35%, #ffe066, #ffd700, #b8860b)",
              boxShadow: "0 0 8px #ffd70066",
              border: "1.5px solid #ffd700",
            }} />
          ))}

          {/* SVG Claw mechanism */}
          <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }} viewBox="0 0 540 340">
            {/* Track rail */}
            <rect x={20} y={18} width={500} height={10} rx={5} fill="#555" />
            <Claw />
          </svg>
        </div>

        {/* Dropped loot pile in output tray */}
        <div style={{
          position: "absolute",
          bottom: "12%", left: "30%",
          width: "40%", height: "14%",
          opacity: lootOpacity,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          {["#ffd700", "#ffd700", "#ffd700"].map((c, i) => (
            <div key={i} style={{
              width: 22, height: 22, borderRadius: "50%",
              background: `radial-gradient(circle at 35% 35%, #ffe066, ${c}, #b8860b)`,
              boxShadow: `0 0 12px ${c}`,
            }} />
          ))}
          <div style={{
            width: 54, height: 26,
            background: "linear-gradient(135deg, #ffe066, #ffd700, #b8860b)",
            borderRadius: 5, border: "1.5px solid #b8860b",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 9, fontWeight: 900, color: "#7a5800",
            boxShadow: "0 0 14px #ffd700aa",
          }}>GOLD</div>
          <div style={{
            width: 24, height: 24,
            background: "#a855f7",
            clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)",
            filter: "drop-shadow(0 0 8px #a855f7)",
          }} />
        </div>

        {/* Output tray slot */}
        <div style={{
          position: "absolute",
          bottom: "10%", left: "25%", width: "50%", height: 8,
          background: "#111", borderRadius: 4,
          boxShadow: "inset 0 2px 6px #000",
        }} />

        {/* Bottom panel with buttons */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "9%",
          background: "#1a0033",
          borderRadius: "0 0 25px 25px",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 18,
        }}>
          {["#ff4444", "#39ff14", "#00e5ff"].map((c, i) => (
            <div key={i} style={{
              width: 28, height: 28, borderRadius: "50%",
              background: c,
              boxShadow: `0 0 14px ${c}, 0 0 28px ${c}44`,
              border: "2px solid #fff4",
            }} />
          ))}
        </div>

      </div>

      {/* Floating coins & gems around machine */}
      <Coin x={60} y={180} delay={20} size={32} />
      <Coin x={82} y={320} delay={35} size={24} />
      <Coin x={width - 100} y={200} delay={28} size={30} />
      <Coin x={width - 75} y={360} delay={50} size={22} />
      <GoldBar x={45} y={440} delay={40} rotation={-15} />
      <GoldBar x={width - 130} y={480} delay={55} rotation={12} />
      <Gem x={55} y={530} delay={30} color="#a855f7" />
      <Gem x={width - 90} y={540} delay={45} color="#00e5ff" />
      <Gem x={40} y={640} delay={60} color="#ff4444" />
    </div>
  );
};

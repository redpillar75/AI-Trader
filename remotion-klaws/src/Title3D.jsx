import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

const Letter3D = ({ char, index, total, startFrame = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const appear = spring({
    frame: frame - startFrame - index * 4,
    fps,
    config: { damping: 10, stiffness: 90, mass: 0.8 },
  });

  const floatY = interpolate(
    Math.sin(((frame + index * 22) / 40) * Math.PI * 2),
    [-1, 1], [-5, 5]
  );

  const rotateX = interpolate(
    Math.sin(((frame + index * 15) / 50) * Math.PI * 2),
    [-1, 1], [-12, 12]
  );

  const hue = (frame * 1.5 + index * 30) % 360;

  return (
    <div style={{
      display: "inline-block",
      transform: `
        translateY(${floatY + (1 - appear) * 80}px)
        scale(${appear})
        rotateX(${rotateX}deg)
      `,
      opacity: appear,
      perspective: 600,
      fontFamily: "'Arial Black', 'Impact', sans-serif",
      fontWeight: 900,
      fontSize: 96,
      color: `hsl(${hue}, 100%, 60%)`,
      textShadow: `
        3px 3px 0 hsl(${hue}, 100%, 30%),
        6px 6px 0 hsl(${hue}, 80%, 20%),
        9px 9px 0 hsl(${hue}, 60%, 15%),
        0 0 30px hsl(${hue}, 100%, 70%),
        0 0 60px hsl(${hue}, 100%, 50%)44
      `,
      letterSpacing: 2,
      lineHeight: 1,
      WebkitTextStroke: `2px hsl(${hue}, 100%, 25%)`,
      filter: `drop-shadow(0 8px 16px hsl(${hue}, 100%, 40%))`,
    }}>
      {char === " " ? " " : char}
    </div>
  );
};

export const Title3D = ({ text = "KLAWS 72", startFrame = 0 }) => {
  const frame = useCurrentFrame();
  const chars = text.split("");

  const containerScale = spring({
    frame: frame - startFrame,
    fps: 30,
    config: { damping: 16, stiffness: 60 },
  });

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transform: `scale(${containerScale})`,
      gap: 4,
      perspective: 800,
    }}>
      {chars.map((char, i) => (
        <Letter3D
          key={i}
          char={char}
          index={i}
          total={chars.length}
          startFrame={startFrame}
        />
      ))}
    </div>
  );
};

export const SubTitle3D = ({ text, startFrame = 0, color = "#ffd700" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const appear = spring({ frame: frame - startFrame, fps, config: { damping: 14, stiffness: 70 } });
  const pulse = interpolate(Math.sin((frame / 30) * Math.PI * 2), [-1, 1], [0.95, 1.05]);

  return (
    <div style={{
      fontFamily: "'Arial Black', sans-serif",
      fontWeight: 900,
      fontSize: 36,
      color,
      textShadow: `
        2px 2px 0 #000,
        4px 4px 0 #00000088,
        0 0 20px ${color},
        0 0 40px ${color}88
      `,
      letterSpacing: 6,
      textTransform: "uppercase",
      opacity: appear,
      transform: `scale(${appear * pulse})`,
      WebkitTextStroke: `1px ${color}`,
    }}>
      {text}
    </div>
  );
};

import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

export const Particles = ({ count = 30, color = "#ffd700" }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const seed = i * 137.5;
        const period = 80 + (i % 5) * 20;
        const t = ((frame + seed) % period) / period;

        const x = ((i * 73 + 50) % (width - 40)) + 20;
        const startY = height + 20;
        const endY = -40;
        const y = interpolate(t, [0, 1], [startY, endY]);

        const wobble = Math.sin(t * Math.PI * 4 + i) * 30;
        const size = 4 + (i % 5) * 2;
        const opacity = interpolate(t, [0, 0.1, 0.85, 1], [0, 0.9, 0.9, 0]);
        const hue = (i * 37 + frame * 0.8) % 360;

        return (
          <div key={i} style={{
            position: "absolute",
            left: x + wobble,
            top: y,
            width: size,
            height: size,
            borderRadius: "50%",
            background: color === "rainbow"
              ? `hsl(${hue}, 100%, 65%)`
              : color,
            opacity,
            filter: `blur(0.5px) drop-shadow(0 0 ${size}px ${color === "rainbow" ? `hsl(${hue}, 100%, 65%)` : color})`,
            pointerEvents: "none",
          }} />
        );
      })}
    </>
  );
};

export const Sparkles = ({ x, y, frame: triggerFrame, count = 12 }) => {
  const frame = useCurrentFrame();
  const elapsed = frame - triggerFrame;

  if (elapsed < 0 || elapsed > 50) return null;

  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const speed = 3 + (i % 3) * 1.5;
        const dist = elapsed * speed;
        const px = x + Math.cos(angle) * dist;
        const py = y + Math.sin(angle) * dist;
        const opacity = interpolate(elapsed, [0, 20, 50], [1, 0.9, 0]);
        const size = interpolate(elapsed, [0, 50], [6, 2]);
        const hue = (i * 30 + elapsed * 6) % 360;

        return (
          <div key={i} style={{
            position: "absolute",
            left: px - size / 2,
            top: py - size / 2,
            width: size,
            height: size,
            borderRadius: "50%",
            background: `hsl(${hue}, 100%, 70%)`,
            opacity,
            filter: `drop-shadow(0 0 4px hsl(${hue}, 100%, 70%))`,
            pointerEvents: "none",
          }} />
        );
      })}
    </>
  );
};

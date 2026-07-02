import type {FC, PropsWithChildren} from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';

type GlitchProps = PropsWithChildren<{
	// How often (in frames) a glitch burst fires.
	intervalInFrames?: number;
	// How long each burst lasts, in frames.
	burstLengthInFrames?: number;
}>;

// RGB-channel split + horizontal slice displacement, fired in short periodic
// bursts rather than continuously so it reads as a stylistic hit, not noise.
export const Glitch: FC<GlitchProps> = ({
	children,
	intervalInFrames = 90,
	burstLengthInFrames = 6,
}) => {
	const frame = useCurrentFrame();
	const phase = frame % intervalInFrames;
	const isActive = phase < burstLengthInFrames;

	if (!isActive) {
		return <AbsoluteFill>{children}</AbsoluteFill>;
	}

	const burstSeed = Math.floor(frame / intervalInFrames);
	const maxShiftPx = 14;
	const redShift = interpolateShift(burstSeed, phase, 1, maxShiftPx);
	const blueShift = interpolateShift(burstSeed, phase, 2, maxShiftPx);
	const sliceOffset = (random(`slice-${burstSeed}-${phase}`) - 0.5) * 30;

	return (
		<AbsoluteFill>
			<AbsoluteFill style={{mixBlendMode: 'screen', filter: 'sepia(1) hue-rotate(-50deg) saturate(6)'}}>
				<AbsoluteFill style={{transform: `translateX(${redShift}px)`}}>{children}</AbsoluteFill>
			</AbsoluteFill>
			<AbsoluteFill style={{mixBlendMode: 'screen', filter: 'sepia(1) hue-rotate(180deg) saturate(6)'}}>
				<AbsoluteFill style={{transform: `translateX(${blueShift}px)`}}>{children}</AbsoluteFill>
			</AbsoluteFill>
			<AbsoluteFill
				style={{
					clipPath: `inset(${45 + sliceOffset}% 0 ${45 - sliceOffset}% 0)`,
					transform: `translateX(${sliceOffset}px)`,
				}}
			>
				{children}
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

const interpolateShift = (
	burstSeed: number,
	phase: number,
	channel: number,
	maxShiftPx: number,
) => {
	const direction = channel === 1 ? 1 : -1;
	const noise = random(`shift-${burstSeed}-${channel}-${phase}`);
	return direction * noise * maxShiftPx;
};

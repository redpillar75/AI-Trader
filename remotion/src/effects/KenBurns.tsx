import type {FC, PropsWithChildren} from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

type KenBurnsProps = PropsWithChildren<{
	startScale?: number;
	endScale?: number;
	panXPercent?: number;
	panYPercent?: number;
}>;

// Slow zoom + pan across the full duration of the composition, the classic
// "Ken Burns" move used to keep static or locked-off footage feeling alive.
export const KenBurns: FC<KenBurnsProps> = ({
	children,
	startScale = 1,
	endScale = 1.12,
	panXPercent = -2,
	panYPercent = 1,
}) => {
	const frame = useCurrentFrame();
	const {durationInFrames} = useVideoConfig();

	const scale = interpolate(frame, [0, durationInFrames], [startScale, endScale], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const translateX = interpolate(frame, [0, durationInFrames], [0, panXPercent]);
	const translateY = interpolate(frame, [0, durationInFrames], [0, panYPercent]);

	return (
		<AbsoluteFill
			style={{
				transform: `scale(${scale}) translate(${translateX}%, ${translateY}%)`,
				transformOrigin: 'center center',
			}}
		>
			{children}
		</AbsoluteFill>
	);
};

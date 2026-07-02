import type {FC} from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

type TitleCardProps = {
	text: string;
	durationInFrames: number;
};

// Springy scale/fade intro title, then a fast fade-out as it hands off to
// the footage underneath.
export const TitleCard: FC<TitleCardProps> = ({text, durationInFrames}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const entrance = spring({frame, fps, config: {damping: 12, mass: 0.6}});
	const exitStart = durationInFrames - 15;
	const opacity = interpolate(frame, [0, 10, exitStart, durationInFrames], [0, 1, 1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	return (
		<AbsoluteFill
			style={{
				alignItems: 'center',
				justifyContent: 'center',
				backgroundColor: 'black',
				opacity,
			}}
		>
			<div
				style={{
					fontFamily: 'Helvetica, Arial, sans-serif',
					fontWeight: 800,
					fontSize: 110,
					letterSpacing: 12,
					color: 'white',
					textAlign: 'center',
					transform: `scale(${entrance})`,
					textShadow: '0 0 40px rgba(255,255,255,0.35)',
				}}
			>
				{text}
			</div>
		</AbsoluteFill>
	);
};

import type {FC} from 'react';
import {AbsoluteFill} from 'remotion';

type VignetteProps = {
	intensity?: number;
};

// Darkens the edges of the frame to pull the eye toward the center.
export const Vignette: FC<VignetteProps> = ({intensity = 0.65}) => {
	return (
		<AbsoluteFill
			style={{
				pointerEvents: 'none',
				background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,${intensity}) 100%)`,
			}}
		/>
	);
};

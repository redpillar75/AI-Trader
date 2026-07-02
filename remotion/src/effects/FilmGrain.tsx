import type {FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';

type FilmGrainProps = {
	opacity?: number;
};

// SVG turbulence noise, re-seeded every frame and blended over the footage,
// for a subtle textured/analog feel instead of a flat digital look.
export const FilmGrain: FC<FilmGrainProps> = ({opacity = 0.08}) => {
	const frame = useCurrentFrame();
	const seed = (frame % 8) + 1;

	return (
		<AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'overlay', opacity}}>
			<svg width="100%" height="100%">
				<filter id={`grain-${seed}`}>
					<feTurbulence
						type="fractalNoise"
						baseFrequency="0.85"
						numOctaves="2"
						seed={seed}
						stitchTiles="stitch"
					/>
					<feColorMatrix type="saturate" values="0" />
				</filter>
				<rect width="100%" height="100%" filter={`url(#grain-${seed})`} />
			</svg>
		</AbsoluteFill>
	);
};

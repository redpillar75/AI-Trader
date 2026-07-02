import type {FC} from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence, staticFile} from 'remotion';
import {ColorGrade} from './effects/ColorGrade';
import {FilmGrain} from './effects/FilmGrain';
import {Glitch} from './effects/Glitch';
import {KenBurns} from './effects/KenBurns';
import {TitleCard} from './effects/TitleCard';
import {Vignette} from './effects/Vignette';
import {TITLE_DURATION_IN_FRAMES, TITLE_TEXT, VIDEO_SRC} from './constants';

export const MainVideo: FC = () => {
	return (
		<AbsoluteFill style={{backgroundColor: 'black'}}>
			<ColorGrade contrast={1.12} saturate={1.3} brightness={1.02}>
				<KenBurns startScale={1} endScale={1.15} panXPercent={-3} panYPercent={1.5}>
					<Glitch intervalInFrames={100} burstLengthInFrames={5}>
						<OffthreadVideo src={staticFile(VIDEO_SRC)} />
					</Glitch>
				</KenBurns>
			</ColorGrade>

			<FilmGrain opacity={0.08} />
			<Vignette intensity={0.6} />

			<Sequence durationInFrames={TITLE_DURATION_IN_FRAMES}>
				<TitleCard text={TITLE_TEXT} durationInFrames={TITLE_DURATION_IN_FRAMES} />
			</Sequence>
		</AbsoluteFill>
	);
};

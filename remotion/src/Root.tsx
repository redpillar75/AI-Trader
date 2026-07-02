import type {FC} from 'react';
import {Composition, staticFile} from 'remotion';
import {getVideoMetadata} from '@remotion/media-utils';
import {MainVideo} from './MainVideo';
import {
	FALLBACK_DURATION_IN_FRAMES,
	FALLBACK_FPS,
	FALLBACK_HEIGHT,
	FALLBACK_WIDTH,
	VIDEO_SRC,
} from './constants';

export const Root: FC = () => {
	return (
		<>
			<Composition
				id="MainVideo"
				component={MainVideo}
				fps={FALLBACK_FPS}
				width={FALLBACK_WIDTH}
				height={FALLBACK_HEIGHT}
				durationInFrames={FALLBACK_DURATION_IN_FRAMES}
				calculateMetadata={async () => {
					// Reads the actual duration/fps/dimensions of public/input.mp4
					// once you've dropped your source video in. Falls back to the
					// defaults above if the file isn't there yet.
					try {
						const src = staticFile(VIDEO_SRC);
						const metadata = await getVideoMetadata(src);
						return {
							fps: FALLBACK_FPS,
							durationInFrames: Math.floor(metadata.durationInSeconds * FALLBACK_FPS),
							width: metadata.width,
							height: metadata.height,
						};
					} catch {
						return {};
					}
				}}
			/>
		</>
	);
};

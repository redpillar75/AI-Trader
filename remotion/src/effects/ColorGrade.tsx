import type {FC, PropsWithChildren} from 'react';
import {AbsoluteFill} from 'remotion';

type ColorGradeProps = PropsWithChildren<{
	contrast?: number;
	saturate?: number;
	brightness?: number;
	hueRotateDeg?: number;
}>;

// Wraps footage in a CSS filter stack for a quick teal/orange-style grade
// without touching the source file.
export const ColorGrade: FC<ColorGradeProps> = ({
	children,
	contrast = 1.1,
	saturate = 1.25,
	brightness = 1.02,
	hueRotateDeg = 0,
}) => {
	return (
		<AbsoluteFill
			style={{
				filter: `contrast(${contrast}) saturate(${saturate}) brightness(${brightness}) hue-rotate(${hueRotateDeg}deg)`,
			}}
		>
			{children}
		</AbsoluteFill>
	);
};

import React from 'react'
import { Composition } from 'remotion'
import { KlawsTitle } from './compositions/KlawsTitle'
import { KlawsLowerThird } from './compositions/KlawsLowerThird'
import { KlawsCountdown } from './compositions/KlawsCountdown'

export const RemotionRoot: React.FC = () => (
  <>
    {/* Full title card — 5 seconds at 30fps */}
    <Composition
      id="KlawsTitle"
      component={KlawsTitle}
      durationInFrames={150}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{}}
    />

    {/* Lower third overlay — 3 seconds */}
    <Composition
      id="KlawsLowerThird"
      component={KlawsLowerThird}
      durationInFrames={90}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{
        name: 'K.L.A.W.S',
        title: 'NEW YORK',
      }}
    />

    {/* 5-second countdown — 5 seconds */}
    <Composition
      id="KlawsCountdown"
      component={KlawsCountdown}
      durationInFrames={150}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{}}
    />

    {/* Vertical / Story format title card */}
    <Composition
      id="KlawsTitleStory"
      component={KlawsTitle}
      durationInFrames={150}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{}}
    />
  </>
)

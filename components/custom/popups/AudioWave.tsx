// src/components/AudioWave.tsx

import { Box } from '@mui/material'
import { keyframes, styled } from '@mui/system'
import React, { useEffect, useState } from 'react'

interface AudioWaveProps {
  isPlaying: boolean
  onClick?: () => void
}

const bounce = keyframes`
  0%, 100% {
    transform: scaleY(1);
  }
  50% {
    transform: scaleY(2);
  }
`

const WaveContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  height: '50px',
  width: '100%',
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(4),
  cursor: 'pointer',
}))

const WaveBar = styled(Box)<{ isPlaying: boolean; height: number }>(
  ({ isPlaying, height, theme }) => ({
    width: '4px',
    height: `${height}%`,
    backgroundColor: theme.palette.primary.main,
    margin: '0 2px',
    animation: isPlaying ? `${bounce} 0.6s infinite ease-in-out` : 'none',
    animationDelay: `${Math.random() * 0.6}s`,
  })
)

const AudioWave: React.FC<AudioWaveProps> = ({ isPlaying, onClick }) => {
  const [barHeights, setBarHeights] = useState<number[]>([])

  useEffect(() => {
    const generateBarHeights = () => {
      const numBars = 15
      const middleBar = Math.floor(numBars / 2)

      return Array.from({ length: numBars }, (_, index) => {
        const distanceFromMiddle = Math.abs(index - middleBar)
        const maxHeight = 100 - distanceFromMiddle * 10
        return Math.max(20, Math.floor(Math.random() * maxHeight))
      })
    }

    setBarHeights(generateBarHeights())
  }, [])

  return (
    <WaveContainer onClick={onClick}>
      {barHeights.map((height, index) => (
        <WaveBar key={index} isPlaying={isPlaying} height={height} />
      ))}
    </WaveContainer>
  )
}

export default AudioWave

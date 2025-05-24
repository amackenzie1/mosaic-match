// src/components/Popups/SongPopup.tsx

import DownloadIcon from '@mui/icons-material/Download'
import MusicNoteIcon from '@mui/icons-material/MusicNote'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import {
  Box,
  Button,
  Link,
  MenuItem,
  Modal,
  Select,
  SelectChangeEvent,
  Slider,
  Typography,
} from '@mui/material'
import CircularProgress from '@mui/material/CircularProgress'
import LinearProgress from '@mui/material/LinearProgress'
import { keyframes, styled } from '@mui/system'
import { saveAs } from 'file-saver'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useS3Fetcher } from '@/lib/utils/fetcher'
import {
  customSongLoader,
  customSongSaver,
  generateSongAndContent,
  Song,
  SongContent,
} from '@/lib/utils/songGeneration'
import { ChatMessage } from '@/lib/types'
import AudioWave from '../AudioWave'
import StyleSelector from './StyleSelector'

const StyledModal = styled(Modal)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}))

const ModalContent = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
  padding: theme.spacing(4),
  maxWidth: 800,
  width: '90%',
  maxHeight: '90vh',
  overflowY: 'auto',
}))

const EllipsisAnimation = styled('span')`
  &::after {
    content: '';
    display: inline-block;
    width: 1em;
    text-align: left;
    animation: ellipsis steps(4, end) 2s infinite;
  }

  @keyframes ellipsis {
    0% {
      content: '';
    }
    25% {
      content: '.';
    }
    50% {
      content: '..';
    }
    75% {
      content: '...';
    }
  }
`

const MemoizedAudioWave = React.memo(
  AudioWave,
  (prevProps, nextProps) => prevProps.isPlaying === nextProps.isPlaying
)

// New AudioPlayer component
const AudioPlayer: React.FC<{
  audioUrl: string | undefined
  selectedSongIndex: number
  onDownload: () => Promise<void>
}> = React.memo(({ audioUrl, selectedSongIndex, onDownload }) => {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState<number | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [isRestarting, setIsRestarting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = audioUrl || ''
      audioRef.current.load()
      setIsPlaying(false)
      setCurrentTime(0)
      setDuration(null)
    }
  }, [selectedSongIndex])

  const handlePlayPause = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }, [isPlaying])

  const handleEnded = useCallback(() => {
    setIsPlaying(false)
  }, [])

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }, [])

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }, [])

  const handleSliderChange = useCallback(
    (_event: Event, newValue: number | number[]) => {
      if (typeof newValue === 'number' && audioRef.current) {
        audioRef.current.currentTime = newValue
        setCurrentTime(newValue)
      }
    },
    []
  )

  const handleRestart = useCallback(() => {
    if (audioRef.current) {
      setIsRestarting(true)
      audioRef.current.currentTime = 0
      audioRef.current.play()
      setIsPlaying(true)
      setTimeout(() => setIsRestarting(false), 500) // Reset after animation
    }
  }, [])

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const rotateKeyframes = keyframes`
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(-360deg);
    }
  `

  const handleDownloadClick = useCallback(async () => {
    setIsDownloading(true)
    try {
      await onDownload()
    } finally {
      setIsDownloading(false)
    }
  }, [onDownload])

  return (
    <>
      <audio
        ref={audioRef}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        style={{ display: 'none' }}
      />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
        }}
      >
        {duration && isFinite(duration) ? (
          <Box sx={{ width: '100%', mb: 2 }}>
            <Slider
              value={currentTime}
              min={0}
              max={duration}
              onChange={handleSliderChange}
            />
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}
            >
              <Typography variant="caption">
                {formatTime(currentTime)}
              </Typography>
              <Typography variant="caption">{formatTime(duration)}</Typography>
            </Box>
          </Box>
        ) : (
          <MemoizedAudioWave isPlaying={isPlaying} onClick={handlePlayPause} />
        )}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button variant="contained" color="primary" onClick={handlePlayPause}>
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleRestart}
            startIcon={
              <RestartAltIcon
                sx={{
                  animation: isRestarting
                    ? `${rotateKeyframes} 0.5s linear`
                    : 'none',
                }}
              />
            }
          >
            Restart
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={
              isDownloading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <DownloadIcon />
              )
            }
            onClick={handleDownloadClick}
            disabled={!audioUrl || isDownloading}
          >
            {isDownloading ? 'Downloading...' : 'Download'}
          </Button>
        </Box>
      </Box>
    </>
  )
})

const GeneratedSongContent: React.FC<{
  category: string
  styles: string[]
  inspiration: string
}> = React.memo(({ category, styles, inspiration }) => {
  console.log('rendering GeneratedSongContent')
  const [isGenerating, setIsGenerating] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSongIndex, setSelectedSongIndex] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)

  const { data: generatedSongs } = useS3Fetcher<SongContent>({
    generator: useCallback(
      async (parsedData: ChatMessage[]) => {
        setIsGenerating(true)
        const result = await generateSongAndContent(
          parsedData,
          category,
          styles,
          inspiration,
          (step: number, progress: number) => {
            setCurrentStep(step)
            setProgress(step * 33.33 + (progress / 100) * 33.33)
          }
        )
        setIsGenerating(false)
        return result
      },
      [category, styles, inspiration]
    ),
    cachePath: 'chat/:hash:/song.json',
    customLoader: customSongLoader,
    customSaver: customSongSaver,
    revalidate: true,
  })

  const steps = [
    'Writing lyrics',
    'Composing melodies',
    'Putting it all together',
  ]

  const handleSongChange = useCallback((event: SelectChangeEvent<number>) => {
    const newIndex = event.target.value as number
    setSelectedSongIndex(newIndex)
  }, [])

  const selectedSong: Song | undefined = useMemo(() => {
    return generatedSongs?.songs[selectedSongIndex]
  }, [generatedSongs, selectedSongIndex])

  // Define the rotation keyframes for counterclockwise rotation

  // Add this new function to handle the download
  const handleDownload = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (selectedSong && selectedSong.audioUrl) {
        const xhr = new XMLHttpRequest()
        xhr.open('GET', selectedSong.audioUrl, true)
        xhr.responseType = 'blob'
        xhr.onload = function () {
          if (this.status === 200) {
            const blob = this.response
            console.log('Downloaded blob size:', blob.size)
            console.log('Blob type:', blob.type)
            if (blob.size === 0) {
              console.error('Downloaded blob is empty')
              setError('Failed to download the song. Please try again.')
              reject(new Error('Downloaded blob is empty'))
              return
            }
            saveAs(blob, `${selectedSong.title}.mp3`)
            resolve()
          } else {
            console.error('XHR request failed:', this.status)
            setError('Failed to download the song. Please try again.')
            reject(new Error(`XHR request failed: ${this.status}`))
          }
        }
        xhr.onerror = function () {
          console.error('XHR request failed')
          setError('Failed to download the song. Please try again.')
          reject(new Error('XHR request failed'))
        }
        xhr.send()
      } else {
        reject(new Error('No song selected or audio URL missing'))
      }
    })
  }, [selectedSong, setError])

  const memoizedImage = useMemo(() => {
    return (
      <img
        src={selectedSong?.imageUrl}
        alt={`Artwork for ${selectedSong?.title}`}
        style={{
          width: '100%',
          marginBottom: '1rem',
          borderRadius: '8px',
        }}
      />
    )
  }, [selectedSongIndex, Boolean(selectedSong?.imageUrl)])

  return (
    <>
      {isGenerating && !generatedSongs && (
        <Box sx={{ width: '100%', mt: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {steps[currentStep]}
            <EllipsisAnimation />
          </Typography>
          <LinearProgress variant="determinate" value={progress} />
        </Box>
      )}

      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}

      {generatedSongs && selectedSong && (
        <Box sx={{ mt: 3 }}>
          <Select
            value={selectedSongIndex}
            onChange={handleSongChange}
            fullWidth
            sx={{ mb: 2 }}
            displayEmpty
            inputProps={{ 'aria-label': 'Select Song' }}
          >
            {generatedSongs.songs.map((song, index) => (
              <MenuItem key={index} value={index}>
                {song.title}
              </MenuItem>
            ))}
          </Select>
          <Typography variant="h5" gutterBottom>
            {selectedSong.title}
          </Typography>
          {memoizedImage}
          <AudioPlayer
            audioUrl={selectedSong.audioUrl}
            selectedSongIndex={selectedSongIndex}
            onDownload={handleDownload}
          />
        </Box>
      )}
    </>
  )
})

interface SongPopupProps {
  open: boolean
  onClose: () => void
  suggestedCategory: string
  suggestedStyles: string[]
}

const SongPopup: React.FC<SongPopupProps> = ({
  open,
  onClose,
  suggestedCategory,
  suggestedStyles,
}) => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [category, setCategory] = useState<string>(suggestedCategory)
  const [styles, setStyles] = useState<string[]>(suggestedStyles)
  const [inspiration, setInspiration] = useState<string>('')
  const [showSelectionArea, setShowSelectionArea] = useState(false)

  useEffect(() => {
    if (!open) {
      setCategory(suggestedCategory)
      setStyles(suggestedStyles)
      setInspiration('')
      setShowSelectionArea(false)
      setIsGenerating(false)
    }
  }, [open, suggestedCategory, suggestedStyles])

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory)
  }

  const handleStylesChange = (newStyles: string[]) => {
    setStyles(newStyles)
  }

  const handleInspirationChange = (newInspiration: string) => {
    setInspiration(newInspiration)
  }

  const handleToggleSelectionArea = () => {
    setShowSelectionArea((prev) => !prev)
  }

  const memoizedGeneratedSongContent = useMemo(
    () => (
      <GeneratedSongContent
        category={category}
        styles={styles}
        inspiration={inspiration}
      />
    ),
    [category, styles, inspiration]
  )

  return (
    <StyledModal open={open} onClose={onClose}>
      <ModalContent>
        {!isGenerating ? (
          <>
            <MusicNoteIcon
              sx={{ fontSize: 60, color: 'primary.main', mb: 2 }}
            />
            <Typography variant="h4" component="h2" gutterBottom>
              Create Your Unique Song
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              We've suggested a category and styles based on your conversation.
              You can customize these or add inspiration before generating your
              song.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Link
                component="button"
                variant="body2"
                onClick={handleToggleSelectionArea}
              >
                Customize Song (optional)
              </Link>
            </Box>
            {showSelectionArea && (
              <StyleSelector
                onCategoryChange={handleCategoryChange}
                onStylesChange={handleStylesChange}
                onInspirationChange={handleInspirationChange}
                initialCategory={category}
                initialStyles={styles}
                initialInspiration={inspiration}
              />
            )}
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setIsGenerating(true)}
                size="large"
                startIcon={<MusicNoteIcon />}
                sx={{
                  py: 1.5,
                  px: 4,
                  fontSize: '1.1rem',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  '&:hover': {
                    boxShadow: '0 6px 8px rgba(0, 0, 0, 0.15)',
                  },
                  mt: 3,
                }}
              >
                Generate My Song
              </Button>
            </Box>
          </>
        ) : (
          memoizedGeneratedSongContent
        )}
      </ModalContent>
    </StyledModal>
  )
}

export default SongPopup

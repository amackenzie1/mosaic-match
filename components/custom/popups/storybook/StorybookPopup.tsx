import {
  Backdrop,
  Box,
  CircularProgress,
  Fade,
  Modal,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from '@mui/material'
import { styled } from '@mui/material/styles'
import React, { useCallback, useEffect, useState } from 'react'
import { useGeneralInfoContext } from '../../../GeneralInfoContext'
import { useS3Fetcher } from '../../../utils/fetcher'
import {
  generateChapters,
  storyS3Operations,
} from '../../../utils/storyGeneration'
import { ChatMessage } from '../../../utils/types'
import ChapterGenerateStory from './ChapterGenerateStory'
import ChapterSelectStory from './ChapterSelectStory'
import StyleSelectStory from './StyleSelectStory'

interface Chapter {
  title: string
  summary: string
}

const steps = ['Choose Your Story Style', 'Review Chapters', 'Generate Chapter']

const ContentBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.spacing(2),
  maxWidth: 800,
  width: '90%',
  margin: 'auto',
  marginTop: theme.spacing(4),
  position: 'relative',
  maxHeight: '90vh',
  overflowY: 'auto',
}))

const StorybookPopup: React.FC<{
  open: boolean
  onClose: () => void
}> = ({ open, onClose }) => {
  const [activeStep, setActiveStep] = useState(0)
  const [selectedStyle, setSelectedStyle] = useState('')
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null)
  const [chapters, setChapters] = useState<Chapter[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [shouldGenerate, setShouldGenerate] = useState(false)
  const [isChatDataLoading, setIsChatDataLoading] = useState(true)

  const { data: chatData } = useS3Fetcher<ChatMessage[]>({
    generator: useCallback(async (parsedData: ChatMessage[]) => {
      return parsedData
    }, []),
    cachePath: 'chat/:hash:/messages.json',
    customLoader: storyS3Operations.loadStory,
    customSaver: storyS3Operations.saveStory,
    revalidate: true,
  })

  // Add effect to log chat data changes
  useEffect(() => {
    console.log('Chat data updated:', {
      hasData: !!chatData,
      dataLength: chatData?.length,
    })
    setIsChatDataLoading(false)
  }, [chatData])

  // Generate chapters without needing tokens
  useEffect(() => {
    const generateStory = async () => {
      if (shouldGenerate && selectedStyle && chatData) {
        setIsLoading(true)
        try {
          const result = await generateChapters(selectedStyle, chatData)
          setChapters(result)
        } catch (error) {
          console.error('Error generating chapters:', error)
        } finally {
          setIsLoading(false)
          setShouldGenerate(false)
        }
      }
    }

    generateStory()
  }, [shouldGenerate, selectedStyle, chatData])

  const handleNext = () => {
    console.log('handleNext called in StorybookPopup', {
      activeStep,
      selectedStyle,
      shouldGenerate,
      chatDataLength: chatData?.length,
    })

    if (activeStep === 0) {
      console.log('Setting shouldGenerate to true')
      setShouldGenerate(true)
      setActiveStep((prev) => prev + 1)
    } else {
      setActiveStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    setActiveStep((prev) => prev - 1)
  }

  const handleStyleSelect = (style: string) => {
    console.log('Style selected in StorybookPopup:', style)
    setSelectedStyle(style)
  }

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <StyleSelectStory
            selectedStyle={selectedStyle}
            onStyleSelect={handleStyleSelect}
            onNext={handleNext}
          />
        )
      case 1:
        if (isChatDataLoading) {
          return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Loading chat data...</Typography>
            </Box>
          )
        }
        if (isLoading || !chapters) {
          return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Generating chapters...</Typography>
            </Box>
          )
        }
        return (
          <ChapterSelectStory
            chapters={chapters}
            selectedChapter={selectedChapter}
            onChapterSelect={setSelectedChapter}
            onNext={handleNext}
            onBack={handleBack}
          />
        )
      case 2:
        return (
          <ChapterGenerateStory
            style={selectedStyle}
            chapter={selectedChapter}
            onBack={handleBack}
            onClose={onClose}
          />
        )
      default:
        return null
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      BackdropComponent={Backdrop}
    >
      <Fade in={open}>
        <ContentBox>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          {renderStepContent()}
        </ContentBox>
      </Fade>
    </Modal>
  )
}

export default StorybookPopup

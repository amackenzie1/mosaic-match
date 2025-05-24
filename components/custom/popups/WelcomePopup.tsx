import { Box, Button, Modal, Typography, styled } from '@mui/material'
import React from 'react'

interface WelcomePopupProps {
  open: boolean
  onClose: () => void
}

const StyledButton = styled(Button)({
  padding: '12px 24px',
  fontSize: '1rem',
  fontWeight: 600,
  textTransform: 'none',
  borderRadius: '50px',
  transition: 'all 0.3s ease',
})

const LoginButton = styled(StyledButton)({
  color: '#fff',
  backgroundColor: '#000',
  border: '2px solid #000',
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
})

const SignUpButton = styled(StyledButton)({
  color: '#000',
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  border: '2px solid #000',
  '&:hover': {
    backgroundColor: '#000',
    color: '#fff',
  },
})

const WelcomePopup: React.FC<WelcomePopupProps> = ({ open, onClose }) => {
  const handleLogin = () => {
    onClose()
    window.location.href = '/signin'
  }

  const handleSignUp = () => {
    onClose()
    window.location.href = '/signup'
  }

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          p: 4,
          bgcolor: 'background.paper',
          borderRadius: 4,
          maxWidth: 400,
          mx: 'auto',
          mt: '15%',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Typography variant="h4" component="h2" gutterBottom fontWeight="bold">
          Welcome!
        </Typography>
        <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
          Log in or sign up to access your UserBoard and unlock global analytics
          tools from your chats!
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <LoginButton onClick={handleLogin}>Log In</LoginButton>
          <SignUpButton onClick={handleSignUp}>
            Create an Account for Free
          </SignUpButton>
        </Box>
      </Box>
    </Modal>
  )
}

export default WelcomePopup

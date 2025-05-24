import { Box, Container } from '@mui/material'
import React from 'react'
import PrivacyPolicy from './PrivacyPolicy'

const PrivacyPolicyPage: React.FC = () => {
  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <PrivacyPolicy />
      </Box>
    </Container>
  )
}

export default PrivacyPolicyPage

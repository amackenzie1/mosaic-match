import { Box, Divider, Link, Typography } from '@mui/material'
import React from 'react'

const DataDeletion: React.FC = () => {
  return (
    <Box sx={{ padding: 4, textAlign: 'center' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Data Deletion Request
      </Typography>
      <Typography variant="body1" sx={{ marginBottom: 2 }}>
        At Mosaic, we are committed to protecting your privacy and ensuring the
        security of your personal data. If you wish to have your data deleted,
        please contact us at:
      </Typography>
      <Link
        href="mailto:contactus.mosaic@gmail.com"
        color="primary"
        underline="hover"
      >
        contactus.mosaic@gmail.com
      </Link>

      <Divider sx={{ my: 4 }} />

      <Typography variant="h5" component="h2" gutterBottom>
        Your Rights
      </Typography>
      <Typography variant="body1" sx={{ marginBottom: 2 }}>
        You have the right to request the deletion of your data at any time.
        This includes:
      </Typography>
      <ul style={{ textAlign: 'left', display: 'inline-block' }}>
        <li>Access and update your personal information</li>
        <li>
          Request deletion of your data (subject to our legal obligations and
          legitimate business interests)
        </li>
        <li>Opt-out of certain data uses for marketing purposes</li>
      </ul>
    </Box>
  )
}

export default DataDeletion

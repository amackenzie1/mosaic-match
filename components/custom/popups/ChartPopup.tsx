import React from 'react';
import { Box, Typography, Modal, Button } from '@mui/material';

interface ChartPopupProps {
  open: boolean;
  onClose: () => void;
}

const ChartPopup: React.FC<ChartPopupProps> = ({ open, onClose }) => {
  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{ p: 4, bgcolor: 'background.paper', borderRadius: 2, maxWidth: 600, mx: 'auto', mt: '10%', textAlign: 'center' }}>
        <Typography variant="h4" component="h2" gutterBottom>
          Personalized Chart
        </Typography>
        <img src="/path/to/concept-art-chart.jpg" alt="Chart Concept Art" style={{ width: '100%', borderRadius: '8px', marginBottom: '16px' }} />
        <Typography variant="body1" sx={{ mb: 2 }}>
          Discover a beautiful, data-driven chart showcasing the ebb and flow of your relationship, visualized in a stunning and meaningful way.
        </Typography>
        <Typography variant="body1" sx={{ mb: 4 }}>
          This personalized chart is a perfect way to reflect on your journey together, making it an ideal gift or a unique piece of decor.
        </Typography>
        <Button variant="contained" color="primary" onClick={onClose} sx={{ mt: 2 }}>
          Get Your Chart Now
        </Button>
      </Box>
    </Modal>
  );
};

export default ChartPopup;
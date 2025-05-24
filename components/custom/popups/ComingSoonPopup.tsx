import { Box, Link, Modal, Typography } from "@mui/material";
import React from "react";

interface ComingSoonPopupProps {
  open: boolean;
  onClose: () => void;
}

const ComingSoonPopup: React.FC<ComingSoonPopupProps> = ({ open, onClose }) => {
  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          p: 4,
          bgcolor: "background.paper",
          borderRadius: 2,
          maxWidth: 600,
          mx: "auto",
          mt: "10%",
          textAlign: "center",
        }}
      >
        <Typography variant="body1">
          Currently in development, stay tuned for updates!{" "}
          <Link
            href="https://discord.gg/qPTWCdeUgQ"
            target="_blank"
            rel="noopener noreferrer"
          >
            (Join our Discord?)
          </Link>
        </Typography>
      </Box>
    </Modal>
  );
};

export default ComingSoonPopup;

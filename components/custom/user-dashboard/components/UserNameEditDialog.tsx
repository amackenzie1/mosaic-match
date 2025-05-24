import { ChatUser } from '@/lib/types'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  TextField,
} from '@mui/material'
import { useState } from 'react'

type UserNameEditDialogProps = {
  open: boolean
  users: ChatUser[]
  onClose: () => void
  onNameChange: (updatedUsers: ChatUser[]) => void
}

const UserNameEditDialog: React.FC<UserNameEditDialogProps> = ({
  open,
  onClose,
  users,
  onNameChange,
}) => {
  const [editedNames, setEditedNames] = useState<ChatUser[]>(users)

  console.log('editedNames in dialog', editedNames)
  const handleSave = () => {
    onNameChange(editedNames)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Display Names</DialogTitle>
      <DialogContent>
        <List>
          {editedNames?.map((user) => (
            <ListItem key={user.username}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  gap: 2,
                }}
              >
                <TextField
                  disabled
                  label="Username"
                  value={user.username}
                  size="small"
                  sx={{ flexBasis: '30%' }}
                />
                <TextField
                  label="Display Name"
                  value={user.name}
                  onChange={(e) =>
                    setEditedNames((prev) =>
                      prev.map((u) =>
                        u.username === user.username
                          ? { ...u, name: e.target.value }
                          : u
                      )
                    )
                  }
                  size="small"
                  sx={{ flexBasis: '40%' }}
                />
              </Box>
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default UserNameEditDialog

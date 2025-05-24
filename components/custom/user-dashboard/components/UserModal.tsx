import { Button, Dialog, DialogContent, DialogTitle } from '@mui/material'
import Box from '@mui/material/Box'
import { useEffect } from 'react'
import { useGeneralInfo } from '@/lib/contexts/general-info'
import { mutateS3Cache } from '@/lib/utils/mutateS3Cache'
import { uploadJsonToS3 } from '@amackenzie1/mosaic-lib'
import { ChatUser } from '@/lib/types'

type UserModalProps = {
  open: boolean
  users: ChatUser[]
  onClose: () => void
  setUsers: (users: ChatUser[]) => void
}

const UserModal: React.FC<UserModalProps> = ({
  open,
  onClose,
  users,
  setUsers,
}) => {
  const { hash } = useGeneralInfo()

  // Auto-select "me" if it exists
  useEffect(() => {
    if (open && users) {
      const meUser = users.find((u) => u.name.toLowerCase() === 'me')
      if (meUser) {
        handleUserSelect(meUser.username)
      }
    }
  }, [open, users])

  const handleUserSelect = (username: string) => {
    if (users) {
      const updatedUsers = users.map((u) => ({
        ...u,
        isMe: u.username === username,
        edited: true,
      }))
      setUsers(updatedUsers)
      uploadJsonToS3(`chat/${hash}/people.json`, updatedUsers)
      mutateS3Cache(hash || '', `chat/:hash:/people.json`)
    }
    onClose()
  }

  // If there's a "me" user, don't show the modal at all
  if (users?.some((u) => u.name.toLowerCase() === 'me')) {
    return null
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        Who are you?
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {users?.map((user) => (
            <Button
              key={user.username}
              variant={user.isMe ? 'contained' : 'outlined'}
              onClick={() => handleUserSelect(user.username)}
              sx={{
                py: 1.5,
                fontSize: '1rem',
                textTransform: 'none',
                borderRadius: 2,
                boxShadow: user.isMe ? 2 : 0,
                '&:hover': {
                  boxShadow: 3,
                },
              }}
            >
              {user.name}
            </Button>
          ))}
          <Button
            variant={users?.every((u) => !u.isMe) ? 'contained' : 'outlined'}
            onClick={() => handleUserSelect('')}
            sx={{
              py: 1.5,
              fontSize: '1rem',
              textTransform: 'none',
              borderRadius: 2,
              boxShadow: users?.every((u) => !u.isMe) ? 2 : 0,
              '&:hover': {
                boxShadow: 3,
              },
            }}
          >
            Neither
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  )
}

export default UserModal

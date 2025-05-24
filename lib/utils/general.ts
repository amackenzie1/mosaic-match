import { ChatUser } from '@/lib/types'

export function formatDate(date: Date) {
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getUserName(users: ChatUser[], username: string) {
  return users.find((user) => user.username === username)?.name || username
}

export function updateUserReferences(text: string, users: ChatUser[]) {
  if (!text || !users) return text

  // Get all possible names for each user
  const nameMap = users.reduce((acc, user) => {
    const displayName = getUserName(users, user.username)
    return {
      ...acc,
      [user.username]: displayName,
      [user.name]: displayName,
      ...(user.isMe ? { 'User 1': displayName } : { 'User 2': displayName }),
      // Add common AI output formats
      [`Person ${user.isMe ? '1' : '2'}`]: displayName,
      [`Speaker ${user.isMe ? '1' : '2'}`]: displayName,
      [`Participant ${user.isMe ? '1' : '2'}`]: displayName,
    }
  }, {} as Record<string, string>)

  // Replace all possible variations of names with current display name
  let updatedText = text
  Object.entries(nameMap).forEach(([oldName, newName]) => {
    const regex = new RegExp(`\\b${oldName}\\b`, 'gi')
    updatedText = updatedText.replace(regex, newName)
  })

  return updatedText
}

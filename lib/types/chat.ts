export interface ChatMessage {
  user: string
  message: string
  date: Date
  index: number // Add this line
}

export type MessageExtra = {
  sentiment: number
}

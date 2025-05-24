'use client'

import type { ChatMessage, ChatUser } from '@/lib/types'
import { createContext, ReactNode, useContext, useState } from 'react'

interface GeneralInfoContextType {
  hash: string
  token: string
  file: File | null
  parsedData: ChatMessage[] | null
  users: ChatUser[] | null
  setHash: (hash: string) => void
  setToken: (token: string) => void
  setFile: (file: File | null) => void
  setParsedData: (data: ChatMessage[] | null) => void
  setUsers: (users: ChatUser[] | null) => void
}

const GeneralInfoContext = createContext<GeneralInfoContextType>({
  hash: '',
  token: '',
  file: null,
  parsedData: null,
  users: null,
  setHash: () => {},
  setToken: () => {},
  setFile: () => {},
  setParsedData: () => {},
  setUsers: () => {},
})

export const useGeneralInfo = () => useContext(GeneralInfoContext)

interface GeneralInfoProviderProps {
  children: ReactNode
}

export const GeneralInfoProvider: React.FC<GeneralInfoProviderProps> = ({
  children,
}) => {
  const [hash, setHash] = useState('')
  const [token, setToken] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ChatMessage[] | null>(null)
  const [users, setUsers] = useState<ChatUser[] | null>(null)

  return (
    <GeneralInfoContext.Provider
      value={{
        hash,
        token,
        file,
        parsedData,
        users,
        setHash,
        setToken,
        setFile,
        setParsedData,
        setUsers,
      }}
    >
      {children}
    </GeneralInfoContext.Provider>
  )
}

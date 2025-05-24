'use client'

import { configureAmplify } from '@/lib/amplify-config'
import { useEffect } from 'react'

export default function AmplifyProvider({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    configureAmplify()
  }, [])

  return <>{children}</>
}

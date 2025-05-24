import { fetchAuthSession } from 'aws-amplify/auth'
import axios, { AxiosError } from 'axios'
import { getHeaders } from './hashAuthentication'
import { mutateS3Cache } from './mutateS3Cache'

async function performTokenAction<T>(
  action: (token: string) => Promise<T>,
  token: string,
  refreshToken: () => Promise<string>,
  doRefreshToken: boolean = true
): Promise<T> {
  const maxRetries = 3
  let retries = 0

  while (retries < maxRetries) {
    try {
      return await action(token)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError
        if (axiosError.response) {
          if (axiosError.response.status === 401 && doRefreshToken) {
            const newToken = await refreshToken()
            if (!newToken) {
              throw new Error('Failed to refresh token')
            }
            // don't refresh again if we're already trying to refresh
            return performTokenAction(action, newToken, refreshToken, false)
          }
          // If we have a response, it's an HTTP error, so we don't retry
          throw error
        }
      }

      retries++
      if (retries === maxRetries) {
        throw new Error(
          `Error performing action with token after ${maxRetries} attempts: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        )
      }
      // Wait for 1 second before retrying
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  throw new Error('Unexpected end of performTokenAction')
}

export async function requestFileWithToken(
  token: string,
  refreshToken: () => Promise<string>,
  desiredFilePath: string,
  presignedUrl: boolean = false
): Promise<any> {
  return performTokenAction(
    async (currentToken) => {
      const response = await axios.post(
        process.env.NEXT_PUBLIC_PUBLIC_LAMBDA_ENDPOINT!,
        {
          action: 'request',
          token: currentToken,
          requestedFilePath: desiredFilePath,
          presignedUrl,
        }
      )

      if (response.data && response.data.requestedContent) {
        return response.data.requestedContent
      } else {
        throw new Error('File content not returned from Lambda')
      }
    },
    token,
    refreshToken
  )
}

export async function deleteFileWithToken(
  token: string,
  refreshToken: () => Promise<string>,
  key: string
): Promise<any> {
  return performTokenAction(
    async (currentToken) => {
      const response = await axios.post(
        process.env.NEXT_PUBLIC_PUBLIC_LAMBDA_ENDPOINT!,
        {
          action: 'delete',
          token: currentToken,
          key,
        }
      )
      return response.data
    },
    token,
    refreshToken
  )
}

export async function requestFileWithAuth(
  hash: string,
  requestedFilePath: string,
  presignedUrl: boolean = false
): Promise<any> {
  const headers = await getHeaders(
    process.env.NEXT_PUBLIC_AUTH_LAMBDA_ENDPOINT!
  )
  const response = await axios.post(
    process.env.NEXT_PUBLIC_AUTH_LAMBDA_ENDPOINT!,
    {
      action: 'request',
      hash,
      requestedFilePath,
      presignedUrl,
    },
    {
      headers,
    }
  )
  return response.data.requestedContent
}

export async function deleteFileWithAuth(hash: string, key: string) {
  const headers = await getHeaders(
    process.env.NEXT_PUBLIC_AUTH_LAMBDA_ENDPOINT!
  )
  const response = await axios.post(
    process.env.NEXT_PUBLIC_AUTH_LAMBDA_ENDPOINT!,
    {
      action: 'delete',
      hash,
      key,
    },
    {
      headers,
    }
  )
  console.log('deleteFileWithAuth response', response.data)
}

export async function requestFile(
  desiredFilePath: string,
  hash: string,
  token: string,
  refreshToken: () => Promise<string>,
  presignedUrl: boolean = false
) {
  // const { tokens } = await fetchAuthSession()
  if (token.includes('fake')) {
    return await requestFileWithAuth(hash, desiredFilePath, presignedUrl)
  } else {
    return await requestFileWithToken(
      token,
      refreshToken,
      desiredFilePath,
      presignedUrl
    )
  }
}

export async function deleteFile(
  hash: string,
  key: string,
  token: string,
  refreshToken: () => Promise<string>
) {
  mutateS3Cache(key, hash)
  const { tokens } = await fetchAuthSession()
  if (tokens) {
    return await deleteFileWithAuth(hash, key)
  } else {
    return await deleteFileWithToken(token, refreshToken, key)
  }
}

export async function deleteFileWithPresignedUrl(
  presignedUrl: string
): Promise<void> {
  try {
    await axios.delete(presignedUrl)
    console.log('Object deleted successfully')
  } catch (error) {
    console.error('Error deleting object:', error)
    throw error
  }
}

import { ChatMessage } from '@/lib/types'
import useSWR from 'swr'
import { useGeneralInfo } from '../contexts/general-info'
import { getToken } from './hashAuthentication'
import { requestFile } from './s3cache'
import { checkFileExists, uploadJsonToS3 } from '@amackenzie1/mosaic-lib'

interface UseS3FetcherOptions<T> {
  generator: (parsedData: ChatMessage[]) => Promise<T>
  cachePath: string
  customLoader?: (
    path: string,
    hash: string,
    token: string,
    refreshToken: () => Promise<string>
  ) => Promise<T | null>
  customSaver?: (path: string, hash: string, result: any) => Promise<void>
  wait?: boolean
  revalidate?: boolean
  cachingOff?: boolean
}

export const useS3Fetcher = <T>({
  generator,
  cachePath,
  customLoader,
  customSaver,
  wait = false,
  revalidate = false,
  cachingOff = false,
}: UseS3FetcherOptions<T>) => {
  const { token, hash, file, parsedData } = useGeneralInfo()

  const refreshToken = async () => {
    const token = await getToken(hash || '', file ?? null, 3600)
    return token
  }

  const fetcher = async ([path, hash]: [string, string]) => {
    if (!hash || !token) return null
    if (cachingOff) {
      if (!parsedData) return null
      return await generator(parsedData || [])
    }
    let customFailed = false
    if (customLoader) {
      const result = await customLoader(path, hash, token, refreshToken)
      if (result) {
        return result
      } else {
        customFailed = true
      }
    }
    const desiredFilePath = path.replace(':hash:', hash)
    const exists = await checkFileExists(desiredFilePath)
    if (exists && !customFailed) {
      if (customLoader) {
        return await customLoader(path, hash, token, refreshToken)
      } else {
        return (await requestFile(
          desiredFilePath,
          hash,
          token,
          refreshToken
        )) as T
      }
    } else {
      if (!parsedData) return null
      const result = await generator(parsedData || [])
      if (customSaver) {
        customSaver(path, hash, result)
      } else {
        uploadJsonToS3(desiredFilePath, result as Record<string, any>)
      }
      return result
    }
  }

  const shouldFetch = !wait && hash
  const { data, error, mutate } = useSWR(
    shouldFetch ? [cachePath, hash] : null,
    fetcher,
    {
      revalidateIfStale: revalidate,
      revalidateOnFocus: revalidate,
    }
  )

  return {
    data,
    error,
    mutate,
    isLoading: shouldFetch && !error && !data,
  }
}

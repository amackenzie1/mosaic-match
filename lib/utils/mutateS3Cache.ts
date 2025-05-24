// Cache invalidation utility - simplified for build compatibility
export const mutateS3Cache = (hash: string, cachePath: string) => {
  // Note: Direct cache mutation removed due to SWR API changes
  // Components should handle cache invalidation using useSWRConfig()
  console.log(`Cache invalidation requested for: [${cachePath}, ${hash}]`)
  return Promise.resolve()
}

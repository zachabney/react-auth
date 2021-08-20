import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { User } from './auth-settings-context'
import { AuthTokens, parseJwt } from './auth-utils'
import { useAuthCacheStorage } from './cache-storage'
import { ChildrenProp } from './types/children-prop'
export interface AuthCache {
  accessTokens: {
    [scope: string]: {
      token: string
      expireTime: number // unix epoch in seconds
    }
  }
  idToken: string
  refreshToken: string
  user: User
}

const AuthCacheContext = createContext<{
  cache: AuthCache | null
  setCache: (cache: AuthCache) => void
  isLoading: boolean
}>({ cache: null, setCache: () => {}, isLoading: true })

export const useAuthCache = (): {
  cache: AuthCache | null
  setAuthTokens: (tokens: AuthTokens) => void
  isLoading: boolean
} => {
  const { setAuthCache: storeAuthCache, getAuthCache } = useAuthCacheStorage()
  const { cache, setCache, isLoading } = useContext(AuthCacheContext)

  const setAuthTokens = useCallback(
    ({ accessToken, idToken, refreshToken, scope }: AuthTokens) => {
      const accessTokenClaims = parseJwt(accessToken)
      const idClaims = parseJwt(idToken)

      if (!accessTokenClaims) {
        console.error('The access token could not be parsed.')
        return
      }

      if (!idClaims) {
        console.error('The id token could not be parsed.')
        return
      }

      const existingAccessTokens = getAuthCache()?.accessTokens || {}

      const authCache: AuthCache = {
        accessTokens: {
          ...existingAccessTokens,
          [scope]: {
            token: accessToken,
            expireTime: parseInt(accessTokenClaims.exp),
          },
        },
        idToken,
        refreshToken,
        user: {
          email: idClaims.email,
          firstName: idClaims.given_name,
          lastName: idClaims.family_name,
          roles: idClaims.roles,
        },
      }

      storeAuthCache(authCache)
      setCache(authCache)
    },
    [setCache, storeAuthCache, getAuthCache]
  )

  return {
    cache,
    setAuthTokens,
    isLoading,
  }
}

export const AuthCacheProvider: React.FC<ChildrenProp> = ({ children }) => {
  const [authCache, setAuthCache] = useState<AuthCache | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { getAuthCache } = useAuthCacheStorage()

  useEffect(() => {
    if (!isLoading) {
      return
    }

    const authCache = getAuthCache()
    setAuthCache(authCache)
    setIsLoading(false)
  }, [setAuthCache, getAuthCache, isLoading, setIsLoading])

  return (
    <AuthCacheContext.Provider
      value={{ cache: authCache, setCache: setAuthCache, isLoading }}
    >
      {children}
    </AuthCacheContext.Provider>
  )
}

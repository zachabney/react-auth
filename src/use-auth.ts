import { useCallback } from 'react'
import { useAuthSettings, User } from './auth-settings-context'
import {
  getAuthorizationRequest,
  getEndSessionUri,
  refreshToken,
} from './auth-utils'
import { useAuthCache } from './cache-context'
import { useAuthCacheStorage } from './cache-storage'
import { AuthRequestState } from './callback-handler'

type GetAccessTokenSilentlyOptions = {
  scope?: string
}
export interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  user: User | null
  getAccessTokenSilently: (
    options?: GetAccessTokenSilentlyOptions
  ) => Promise<string>
  redirectToLogin: () => Promise<void>
  redirectToLogout: () => Promise<void>
  clearAuthCache: () => void
}

export const useAuth = (): AuthState => {
  const { cache, setAuthTokens, isLoading } = useAuthCache()

  const { setAuthRequestState, clearAuthCache } = useAuthCacheStorage()
  const authSettings = useAuthSettings()

  const redirectToLogin = useCallback(async () => {
    const { state, codeVerifier, authRedirectUri } =
      await getAuthorizationRequest({ settings: authSettings })

    const authRequestState: AuthRequestState = {
      state,
      codeVerifier,
      loginSuccessRedirectUri: window.location.href,
    }
    setAuthRequestState(authRequestState)

    window.location.href = encodeURI(authRedirectUri)
    return
  }, [authSettings, setAuthRequestState])

  const redirectToLogout = useCallback(async () => {
    clearAuthCache()
    window.location.href = encodeURI(
      getEndSessionUri({ settings: authSettings })
    )
    return new Promise<void>(() => {})
  }, [authSettings, clearAuthCache])

  const getAccessTokenSilently = useCallback(
    async (options?: GetAccessTokenSilentlyOptions) => {
      if (!cache) {
        await redirectToLogin()
        return ''
      }

      const scope = options?.scope || authSettings.scope
      const scopedAccessTokenDetails = cache.accessTokens[scope]

      const refreshThreshold = 60 // seconds
      const currentTimestamp = new Date().getTime() / 1000 // unix epoch in seconds

      if (
        scopedAccessTokenDetails &&
        scopedAccessTokenDetails.expireTime - currentTimestamp >
          refreshThreshold
      ) {
        return scopedAccessTokenDetails.token
      }

      // refresh the token
      try {
        const tokens = await refreshToken({
          refreshToken: cache.refreshToken,
          settings: authSettings,
          scope,
        })

        setAuthTokens(tokens)

        return tokens.accessToken
      } catch (error) {
        console.warn('Unable to refresh the access token', error)
        await redirectToLogin()
        return ''
      }
    },
    [authSettings, cache, redirectToLogin, setAuthTokens]
  )

  if (!cache) {
    return {
      isAuthenticated: false,
      isLoading,
      user: null,
      getAccessTokenSilently,
      redirectToLogin,
      redirectToLogout,
      clearAuthCache,
    }
  }

  return {
    isAuthenticated: true,
    isLoading,
    user: cache.user,
    getAccessTokenSilently,
    redirectToLogin,
    redirectToLogout,
    clearAuthCache,
  }
}

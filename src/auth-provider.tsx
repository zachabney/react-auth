import React, { useMemo } from 'react'
import { AuthSettings, AuthSettingsProvider } from './auth-settings-context'
import { AuthCacheProvider } from './cache-context'
import { ChildrenProp } from './types/children-prop'
import { Optional } from './types/optional'

type AuthProviderProps = Optional<AuthSettings, 'cachePrefix'> & ChildrenProp

export const AuthProvider: React.FC<AuthProviderProps> = ({
  endpoints,
  clientId,
  redirectUri,
  logoutSuccessUri,
  scope,
  cacheStrategy,
  cachePrefix = '',
  children,
}) => {
  const authSettings = useMemo<AuthSettings>(() => {
    return {
      endpoints: {
        authorizationEndpoint: endpoints.authorizationEndpoint,
        endSessionEndpoint: endpoints.endSessionEndpoint,
        tokenEndpoint: endpoints.tokenEndpoint,
      },
      clientId,
      redirectUri,
      logoutSuccessUri,
      scope,
      cacheStrategy,
      cachePrefix,
    }
  }, [
    cachePrefix,
    cacheStrategy,
    clientId,
    endpoints.authorizationEndpoint,
    endpoints.endSessionEndpoint,
    endpoints.tokenEndpoint,
    logoutSuccessUri,
    redirectUri,
    scope,
  ])

  return (
    <AuthSettingsProvider settings={authSettings}>
      <AuthCacheProvider>{children}</AuthCacheProvider>
    </AuthSettingsProvider>
  )
}

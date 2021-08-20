import React, { createContext, useContext } from 'react'
import { AuthCacheStrategy } from './cache-storage'
import { ChildrenProp } from './types/children-prop'

export interface User {
  email: string
  firstName: string
  lastName: string
  roles: string[]
}

export interface AuthEndpoints {
  authorizationEndpoint: string
  tokenEndpoint: string
  endSessionEndpoint: string
}

export interface AuthSettings {
  endpoints: AuthEndpoints
  clientId: string
  redirectUri: string
  logoutSuccessUri: string
  scope: string
  cacheStrategy: AuthCacheStrategy
  cachePrefix: string
}

const AuthSettingsContext = createContext<AuthSettings>({
  endpoints: {
    authorizationEndpoint: '',
    tokenEndpoint: '',
    endSessionEndpoint: '',
  },
  clientId: '',
  redirectUri: '',
  logoutSuccessUri: '',
  scope: '',
  cacheStrategy: 'localStorage',
  cachePrefix: '',
})

export const useAuthSettings = () => useContext(AuthSettingsContext)

type AuthSettingsProviderProps = {
  settings: AuthSettings
} & ChildrenProp

export const AuthSettingsProvider: React.FC<AuthSettingsProviderProps> = ({
  settings,
  children,
}) => {
  return (
    <AuthSettingsContext.Provider value={settings}>
      {children}
    </AuthSettingsContext.Provider>
  )
}

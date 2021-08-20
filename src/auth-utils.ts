import { nanoid } from 'nanoid'
import { AuthSettings } from './auth-settings-context'

export interface AuthTokens {
  accessToken: string
  idToken: string
  refreshToken: string
  scope: string
}

export async function getAuthorizationRequest({
  settings,
}: {
  settings: AuthSettings
}): Promise<{
  state: string
  codeVerifier: string
  authRedirectUri: string
}> {
  const state = nanoid()
  const codeVerifier = nanoid(128)
  const codeChallenge = await generateCodeChallengeFromVerifier(codeVerifier)

  const authRedirectUri =
    settings.endpoints.authorizationEndpoint +
    `?client_id=${settings.clientId}` +
    `&response_type=code` +
    `&redirect_uri=${settings.redirectUri}` +
    `&response_mode=query` +
    `&scope=${settings.scope}` +
    `&state=${state}` +
    `&code_challenge=${codeChallenge}` +
    `&code_challenge_method=S256`

  return {
    state,
    codeVerifier,
    authRedirectUri,
  }
}

export async function redeemToken({
  authCode,
  codeVerifier,
  settings,
}: {
  authCode: string
  codeVerifier: string
  settings: AuthSettings
}): Promise<AuthTokens | null> {
  const body = {
    client_id: settings.clientId,
    scope: settings.scope,
    code: authCode,
    redirect_uri: settings.redirectUri,
    grant_type: 'authorization_code',
    code_verifier: codeVerifier,
  }

  const res = await fetch(settings.endpoints.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: serializeFormUrlEncodedBody(body),
  })

  const data = await res.json()

  return {
    accessToken: data.access_token,
    idToken: data.id_token,
    refreshToken: data.refresh_token,
    scope: body.scope,
  }
}

export async function refreshToken({
  refreshToken,
  settings,
  scope = settings.scope,
}: {
  refreshToken: string
  settings: AuthSettings
  scope?: string
}): Promise<AuthTokens> {
  const tokenParameters = {
    client_id: settings.clientId,
    scope: scope,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  }

  const res = await fetch(settings.endpoints.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: serializeFormUrlEncodedBody(tokenParameters),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data)
  }

  return {
    accessToken: data.access_token as string,
    idToken: data.id_token as string,
    refreshToken: data.refresh_token as string,
    scope,
  }
}

export function getEndSessionUri({
  settings,
}: {
  settings: AuthSettings
}): string {
  return `${settings.endpoints.endSessionEndpoint}?post_logout_redirect_uri=${settings.logoutSuccessUri}`
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder()
  const data = encoder.encode(plain)
  return await window.crypto.subtle.digest('SHA-256', data)
}

function base64UrlEncode(arrayBuffer: ArrayBufferLike): string {
  let str = ''
  const bytes = new Uint8Array(arrayBuffer)
  for (let i = 0; i < bytes.byteLength; i++) {
    str += String.fromCharCode(bytes[i])
  }
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function generateCodeChallengeFromVerifier(
  verifier: string
): Promise<string> {
  const hashed = await sha256(verifier)
  return base64UrlEncode(hashed)
}

export function parseJwt(token: string): { [key: string]: any } | null {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch (error) {
    console.error('Failed to parse JWT token', error)
    return null
  }
}

function serializeFormUrlEncodedBody(body: { [key: string]: string }): string {
  return Object.entries(body)
    .map(([key, value]) => {
      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    })
    .join('&')
}

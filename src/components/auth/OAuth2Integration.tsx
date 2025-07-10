import React from 'react'
import { Button } from '../ui/button'
import { FaGoogle, FaFacebook, FaGithub } from 'react-icons/fa'

interface OAuth2IntegrationProps {
  onGoogleLogin: () => void
  onFacebookLogin: () => void
  onGithubLogin: () => void
  isLoading?: boolean
}

export const OAuth2Integration: React.FC<OAuth2IntegrationProps> = ({
  onGoogleLogin,
  onFacebookLogin,
  onGithubLogin,
  isLoading = false
}) => {
  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Oder mit Social Media anmelden
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <Button
          variant="outline"
          onClick={onGoogleLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 hover:bg-red-50 hover:border-red-300 transition-colors"
        >
          <FaGoogle className="h-4 w-4 text-red-500" />
          Mit Google anmelden
        </Button>

        <Button
          variant="outline"
          onClick={onFacebookLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-300 transition-colors"
        >
          <FaFacebook className="h-4 w-4 text-blue-600" />
          Mit Facebook anmelden
        </Button>

        <Button
          variant="outline"
          onClick={onGithubLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 hover:bg-gray-50 hover:border-gray-300 transition-colors"
        >
          <FaGithub className="h-4 w-4 text-gray-700" />
          Mit GitHub anmelden
        </Button>
      </div>
    </div>
  )
}

// OAuth2 Service Integration
export class OAuth2Service {
  private static instance: OAuth2Service
  private googleClientId: string = process.env.REACT_APP_GOOGLE_CLIENT_ID || 'demo-google-client-id'
  private facebookAppId: string = process.env.REACT_APP_FACEBOOK_APP_ID || 'demo-facebook-app-id'
  private githubClientId: string = process.env.REACT_APP_GITHUB_CLIENT_ID || 'demo-github-client-id'

  public static getInstance(): OAuth2Service {
    if (!OAuth2Service.instance) {
      OAuth2Service.instance = new OAuth2Service()
    }
    return OAuth2Service.instance
  }

  // Google OAuth2 Integration
  async loginWithGoogle(): Promise<{ token: string; user: any }> {
    try {
      // In production, use Google OAuth2 SDK
      console.log('Google OAuth2 Login initiated...')
      
      // Simulate OAuth2 flow
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockUser = {
            id: 'google_' + Math.random().toString(36).substr(2, 9),
            name: 'Max Mustermann',
            email: 'max.mustermann@gmail.com',
            picture: 'https://via.placeholder.com/150',
            provider: 'google'
          }
          
          const mockToken = 'mock_google_jwt_token_' + Math.random().toString(36)
          
          resolve({ token: mockToken, user: mockUser })
        }, 1500)
      })
    } catch (error) {
      console.error('Google OAuth2 Error:', error)
      throw new Error('Google-Anmeldung fehlgeschlagen')
    }
  }

  // Facebook OAuth2 Integration
  async loginWithFacebook(): Promise<{ token: string; user: any }> {
    try {
      console.log('Facebook OAuth2 Login initiated...')
      
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockUser = {
            id: 'facebook_' + Math.random().toString(36).substr(2, 9),
            name: 'Maria Schmidt',
            email: 'maria.schmidt@facebook.com',
            picture: 'https://via.placeholder.com/150',
            provider: 'facebook'
          }
          
          const mockToken = 'mock_facebook_jwt_token_' + Math.random().toString(36)
          
          resolve({ token: mockToken, user: mockUser })
        }, 1500)
      })
    } catch (error) {
      console.error('Facebook OAuth2 Error:', error)
      throw new Error('Facebook-Anmeldung fehlgeschlagen')
    }
  }

  // GitHub OAuth2 Integration
  async loginWithGithub(): Promise<{ token: string; user: any }> {
    try {
      console.log('GitHub OAuth2 Login initiated...')
      
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockUser = {
            id: 'github_' + Math.random().toString(36).substr(2, 9),
            name: 'Alex Developer',
            email: 'alex.developer@github.com',
            picture: 'https://via.placeholder.com/150',
            provider: 'github'
          }
          
          const mockToken = 'mock_github_jwt_token_' + Math.random().toString(36)
          
          resolve({ token: mockToken, user: mockUser })
        }, 1500)
      })
    } catch (error) {
      console.error('GitHub OAuth2 Error:', error)
      throw new Error('GitHub-Anmeldung fehlgeschlagen')
    }
  }

  // Generic OAuth2 redirect URL builder
  buildOAuth2URL(provider: 'google' | 'facebook' | 'github', redirectUri: string): string {
    const baseURLs = {
      google: 'https://accounts.google.com/oauth/authorize',
      facebook: 'https://www.facebook.com/v12.0/dialog/oauth',
      github: 'https://github.com/login/oauth/authorize'
    }

    const clientIds = {
      google: this.googleClientId,
      facebook: this.facebookAppId,
      github: this.githubClientId
    }

    const scopes = {
      google: 'openid email profile',
      facebook: 'email public_profile',
      github: 'read:user user:email'
    }

    const params = new URLSearchParams({
      client_id: clientIds[provider],
      redirect_uri: redirectUri,
      scope: scopes[provider],
      response_type: provider === 'facebook' ? 'code' : 'code',
      state: Math.random().toString(36).substr(2, 15)
    })

    return `${baseURLs[provider]}?${params.toString()}`
  }
}

export default OAuth2Integration

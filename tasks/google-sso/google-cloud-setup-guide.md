# Google Cloud Console Setup Guide for OAuth 2.0

## Overview
This guide walks you through setting up Google OAuth 2.0 for the Chess application's Google SSO feature.

## Prerequisites
- Google account
- Admin access to Chess application project
- Domain name for production (optional for development)

## Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create New Project**
   - Click "Select a project" dropdown at the top
   - Click "New Project"
   - Enter project name: `chess-app-oauth` (or your preferred name)
   - Select organization (if applicable)
   - Click "Create"

3. **Select Your Project**
   - Make sure your new project is selected in the project dropdown

## Step 2: Enable Google OAuth 2.0 APIs

1. **Navigate to APIs & Services**
   - In the left sidebar, click "APIs & services" → "Library"

2. **Enable Google+ API (if available) or Google People API**
   - Search for "Google People API"
   - Click on "Google People API"
   - Click "Enable"

3. **Enable Google Identity Services**
   - Search for "Google Identity and Access Management (IAM) API"
   - Click "Enable" if not already enabled

## Step 3: Configure OAuth Consent Screen

1. **Go to OAuth Consent Screen**
   - Navigate to "APIs & services" → "OAuth consent screen"

2. **Choose User Type**
   - Select "External" (for public users)
   - Click "Create"

3. **Fill App Information**
   - **App name**: `Chess Game Application`
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
   - **App domain** (optional): Your domain if you have one
   - **Authorized domains**: Add your production domain if available

4. **Scopes Configuration**
   - Click "Add or Remove Scopes"
   - Add the following scopes:
     - `../auth/userinfo.email`
     - `../auth/userinfo.profile`
     - `openid`
   - Click "Update"

5. **Test Users (for development)**
   - Add your email and any test user emails
   - Click "Save and Continue"

## Step 4: Create OAuth 2.0 Credentials

1. **Go to Credentials**
   - Navigate to "APIs & services" → "Credentials"

2. **Create OAuth Client ID**
   - Click "+ Create Credentials" → "OAuth client ID"
   - **Application type**: "Web application"
   - **Name**: `Chess App Web Client`

3. **Configure Authorized Origins**
   - **Authorized JavaScript origins**:
     - `http://localhost:5173` (Vite dev server)
     - `http://localhost:3000` (alternative dev port)
     - Add your production domain when ready

4. **Configure Authorized Redirect URIs**
   - **Authorized redirect URIs**:
     - `http://localhost:5173/auth/google/callback`
     - `http://localhost:3000/auth/google/callback`
     - Add production callback URLs when ready

5. **Create Credentials**
   - Click "Create"
   - **IMPORTANT**: Copy and save:
     - Client ID (starts with numbers, ends with `.apps.googleusercontent.com`)
     - Client Secret (random string)

## Step 5: Set Up Environment Variables

1. **Create/Update Backend .env file**
   ```bash
   # Add to backend/.env
   GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback
   ```

2. **Create/Update Frontend environment**
   ```bash
   # Add to .env or .env.local
   VITE_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
   ```

## Step 6: Security Notes

- **Never commit secrets to version control**
- **Use different credentials for development and production**
- **Regularly rotate client secrets**
- **Monitor OAuth usage in Google Cloud Console**

## Step 7: Testing Setup

1. **Verify APIs are enabled**
   - Check that Google People API shows as "Enabled"

2. **Test OAuth flow**
   - Use Google's OAuth 2.0 Playground: https://developers.google.com/oauthplayground/
   - Enter your Client ID and test the flow

## Troubleshooting

### Common Issues

1. **"redirect_uri_mismatch" error**
   - Ensure redirect URIs in code match those in Google Console
   - Check for trailing slashes and exact URL matches

2. **"invalid_client" error**
   - Verify Client ID and Secret are correct
   - Check that OAuth consent screen is properly configured

3. **"access_denied" error**
   - User cancelled the flow or app not approved
   - Check OAuth consent screen configuration

4. **"invalid_request" error**
   - Check request parameters
   - Verify scopes are properly configured

### Testing Commands

```bash
# Test environment variables are loaded
echo $GOOGLE_CLIENT_ID

# Test API connectivity (after implementing backend)
curl -X POST http://localhost:3000/auth/google/verify \
  -H "Content-Type: application/json" \
  -d '{"token": "test_token"}'
```

## Next Steps

After completing this setup:
1. Update environment variables in your project
2. Implement backend Google OAuth endpoints
3. Create frontend Google SSO button component
4. Test the complete OAuth flow

## References

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
- [OAuth 2.0 Scopes](https://developers.google.com/identity/protocols/oauth2/scopes)
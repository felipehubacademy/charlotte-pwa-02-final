import { PublicClientApplication, Configuration, RedirectRequest } from '@azure/msal-browser';

const msalConfig: Configuration = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID || 'placeholder-client-id',
    authority: process.env.NEXT_PUBLIC_AZURE_AUTHORITY || 'https://login.microsoftonline.com/common',
    redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI || 'http://localhost:3000',
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);

export const loginRequest: RedirectRequest = {
  scopes: ['User.Read', 'GroupMember.Read.All'],
  prompt: 'select_account',
};

export const initializeMsal = async () => {
  await msalInstance.initialize();
};
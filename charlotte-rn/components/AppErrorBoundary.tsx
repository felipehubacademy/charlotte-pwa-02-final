import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';

interface State {
  hasError: boolean;
}

/**
 * Error boundary wrapping the authenticated (app) group.
 * Catches any render-time crash (e.g. ReferenceError, TypeError) that would
 * otherwise freeze the app on the splash/loading screen.
 *
 * On error: redirects to onboarding so the user can re-login cleanly
 * instead of being stuck forever.
 */
export class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(
      '[AppErrorBoundary] Render crash caught:',
      error.message,
      '\n',
      info.componentStack,
    );
  }

  componentDidUpdate(_prevProps: { children: React.ReactNode }, prevState: State) {
    if (this.state.hasError && !prevState.hasError) {
      // Defer navigation so it runs after the current render cycle
      setTimeout(() => {
        try {
          router.replace('/(onboarding)' as any);
        } catch {
          // router may not be ready — ignore, user can manually reopen
        }
      }, 100);
    }
  }

  render() {
    if (this.state.hasError) {
      // Blank screen while redirect fires
      return <View style={{ flex: 1, backgroundColor: '#F4F3FA' }} />;
    }
    return this.props.children;
  }
}

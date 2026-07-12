import { Component } from 'react';
import type { ReactNode } from 'react';
import Button from './ui/Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Unhandled error caught by ErrorBoundary:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas px-4 text-center">
          <h1 className="text-2xl font-bold text-ink">Something went wrong</h1>
          <p className="max-w-sm text-ink-2">An unexpected error occurred. Try reloading the page.</p>
          <Button onClick={() => window.location.assign('/')}>Back to home</Button>
        </div>
      );
    }

    return this.props.children;
  }
}

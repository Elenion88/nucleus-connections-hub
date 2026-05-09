import React from 'react';

interface State { error: Error | null }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error) { console.error('[Nucleus]', error); }
  render() {
    if (this.state.error) {
      return (
        <div className="max-w-xl mx-auto px-6 py-20 text-center">
          <h1 className="display text-2xl font-semibold">Something broke.</h1>
          <p className="text-sm text-nucleus-subtle mt-2">
            We logged the error. Try refreshing — if it persists, we'd love to know.
          </p>
          <pre className="text-xs mt-4 p-3 rounded bg-nucleus-cream border hairline text-left overflow-auto max-h-40">
            {this.state.error.message}
          </pre>
          <button className="btn-outline mt-4" onClick={() => location.reload()}>Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}

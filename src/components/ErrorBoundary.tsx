import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'An unexpected error occurred.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-dvh bg-[#000000] text-[#FFFFFF] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#1A1A1A] border-2 border-[#FFFFFF] p-6 shadow-[6px_6px_0_0_#FF3DAE]">
            <p className="text-xs font-mono-tabular font-bold text-[#FF3DAE]">
              UNSEEN STUDIO RECOVERY
            </p>
            <h1 className="font-display text-2xl font-extrabold mt-2">
              Something interrupted the studio
            </h1>
            <p className="text-xs text-[#A0A0A0] mt-2 leading-relaxed break-words">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 min-h-[44px] px-5 bg-[#00FF99] text-[#000000] border border-[#FFFFFF] text-xs font-bold hover:bg-[#FFE600]"
            >
              Reload Studio
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

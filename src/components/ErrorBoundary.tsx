import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    message: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error.message || 'An unexpected error occurred.',
    };
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      let parsedDetail = this.state.message;
      try {
        const obj = JSON.parse(this.state.message);
        if (obj && typeof obj.error === 'string') {
          parsedDetail = `${obj.error}${obj.path ? ` (${obj.path})` : ''}`;
        }
      } catch {
        // Keep raw message if not JSON
      }

      return (
        <div className="min-h-screen bg-[#FAF6F0] dark:bg-[#140A0D] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white dark:bg-[#231218] border border-[#E5D9C8] dark:border-[#3D222B] rounded-2xl p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#6B1D2F]/10 dark:bg-[#C9A048]/15 flex items-center justify-center text-[#6B1D2F] dark:text-[#C9A048]">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="font-display text-2xl font-semibold text-[#2A151B] dark:text-[#F5EDE2] mb-2">
              Something interrupted your session
            </h2>
            <p className="text-sm text-[#6E535B] dark:text-[#C7B3B8] mb-6 break-words">
              {parsedDetail}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6B1D2F] text-[#FAF6F0] text-sm font-medium hover:bg-[#541524] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Reload Weddmate
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

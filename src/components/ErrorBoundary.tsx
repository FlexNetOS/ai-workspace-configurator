import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-slate-900 border border-red-500/30 p-8 rounded-lg shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 bg-red-600/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white uppercase tracking-tighter font-mono">Kernel Panic: Synthesis Interrupted</h2>
              <p className="text-slate-400 text-sm">The Architect AI encountered a fatal logic error. Please reset the environment.</p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded font-black text-xs uppercase tracking-[.3em] transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Reset_Session
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

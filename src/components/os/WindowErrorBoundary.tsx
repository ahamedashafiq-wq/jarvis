import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';

interface Props {
  moduleTitle: string;
  onReload?: () => void;
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class WindowErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error?.message || 'An unexpected runtime issue occurred in this module.',
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[WindowErrorBoundary] Error in ${this.props.moduleTitle}:`, error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full min-h-[220px] flex flex-col items-center justify-center p-6 text-center font-mono space-y-3 bg-[#050706] text-[#F5F7F6] rounded-b-xl border border-[#FF3B30]/30">
          <div className="p-3 rounded-full bg-[#FF3B30]/15 border border-[#FF3B30]/40 text-[#FF3B30]">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>

          <div className="space-y-1">
            <h3 className="font-bold text-xs text-[#FF3B30] tracking-wider uppercase">
              MODULE ERROR • {this.props.moduleTitle}
            </h3>
            <p className="text-[11px] text-[#8B9992] max-w-sm">
              {this.state.errorMessage}
            </p>
            <p className="text-[10px] text-[#8B9992]/60">
              JARVIS OS isolated this failure. All other active workspaces and modules remain nominal.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={this.handleRetry}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#121C17] border border-[#00D084] text-[#19F59A] text-xs font-bold hover:bg-[#00D084] hover:text-[#050706] transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RETRY</span>
            </button>

            {this.props.onReload && (
              <button
                onClick={() => {
                  this.handleRetry();
                  this.props.onReload?.();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0A100D] border border-[#16281F] text-[#8B9992] hover:text-[#F5F7F6] text-xs transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>RELOAD MODULE</span>
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

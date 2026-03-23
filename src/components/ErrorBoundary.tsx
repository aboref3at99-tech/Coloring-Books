import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({
      errorInfo: error.message
    });
  }

  public render() {
    if (this.state.hasError) {
      let displayMessage = "عذراً، حدث خطأ غير متوقع.";
      let isFirebaseError = false;

      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error && parsed.operationType) {
            isFirebaseError = true;
            displayMessage = `خطأ في قاعدة البيانات: ${parsed.error}`;
          }
        }
      } catch (e) {
        // Not a JSON error message
      }

      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-6">
          <div className="bg-white p-10 rounded-[40px] shadow-2xl max-w-lg w-full text-center border border-red-100">
            <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8">
              <AlertCircle className="text-red-600" size={40} />
            </div>
            <h2 className="text-3xl font-serif font-medium mb-4 text-red-900">عذراً، حدث خطأ</h2>
            <p className="text-red-800/60 mb-8 leading-relaxed">
              {displayMessage}
            </p>
            {isFirebaseError && (
              <div className="bg-red-50 p-4 rounded-2xl mb-8 text-left overflow-x-auto">
                <code className="text-[10px] text-red-900/60 break-all">
                  {this.state.error?.message}
                </code>
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-red-600 text-white rounded-2xl py-4 font-bold hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/20"
            >
              <RefreshCcw size={20} />
              إعادة تحميل التطبيق
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

import React from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { monitoringService } from '../../services/monitoringService';

type AppErrorBoundaryState = {
  hasError: boolean;
};

type AppErrorBoundaryProps = React.PropsWithChildren<Record<string, never>>;

class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  declare readonly props: AppErrorBoundaryProps;
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    void monitoringService.report({
      source: 'react_error_boundary',
      message: error.message,
      stack: `${error.stack || ''}\n${info.componentStack || ''}`
    });
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fff7ed,white_52%)] px-6 py-16 flex items-center justify-center">
        <section className="w-full max-w-xl rounded-[32px] border border-orange-100 bg-white p-8 text-center shadow-2xl shadow-orange-100/60">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-orange-50 text-orange-600">
            <AlertTriangle size={30} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">E-Malla Support</p>
          <h1 className="mt-3 text-3xl font-black text-gray-900">Something needs a quick refresh</h1>
          <p className="mt-4 text-sm font-medium leading-6 text-gray-500">
            The issue has been reported automatically. Refresh the app or return home while our monitoring keeps track of it.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black text-white transition-colors hover:bg-orange-600"
            >
              <RefreshCw size={18} />
              Refresh App
            </button>
            <a
              href="/"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-gray-200 px-5 py-3 text-sm font-black text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Home size={18} />
              Return Home
            </a>
          </div>
        </section>
      </main>
    );
  }
}

export default AppErrorBoundary;

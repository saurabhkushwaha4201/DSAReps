import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from '../ui/Button';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        // Light Observability: Log to local storage for debug
        const logs = JSON.parse(localStorage.getItem('error_logs') || '[]');
        logs.push({ date: new Date().toISOString(), message: error.toString() });
        localStorage.setItem('error_logs', JSON.stringify(logs.slice(-10))); // Keep last 10
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle className="w-8 h-8 text-rose-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Something went wrong</h2>
                    <p className="text-slate-500 mb-6 max-w-md">
                        We've logged the error. Try reloading the page to get back on track.
                    </p>
                    <Button onClick={this.handleReload} className="gap-2">
                        <RefreshCcw size={16} /> Reload Application
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}

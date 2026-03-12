import { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, CheckCircle2 } from 'lucide-react';

const FEEDBACK_TYPES = [
    { value: 'Bug Report 🐛',         label: 'Bug Report 🐛' },
    { value: 'Feature Request 💡',    label: 'Feature Request 💡' },
    { value: 'General Feedback 💬',   label: 'General Feedback 💬' },
];

const FeedbackModal = ({ isOpen, onClose, userName, userEmail }) => {
    const [type, setType]       = useState('Bug Report 🐛');
    const [message, setMessage] = useState('');
    const [status, setStatus]   = useState('idle'); // idle | loading | success | error
    const closeTimeoutRef       = useRef(null);

    // ESC key to close
    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (e) => { if (e.key === 'Escape') handleClose(); };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const accessKey = import.meta.env.VITE_WEB3FORM_ACCESS_KEY;
        if (!accessKey) {
            console.error('[FeedbackModal] VITE_WEB3FORM_ACCESS_KEY is not set');
            setStatus('error');
            return;
        }
        setStatus('loading');

        const safeName  = userName  || 'Anonymous';
        const safeEmail = userEmail || 'no-reply@example.com';

        try {
            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({
                    access_key: accessKey,
                    subject:    `DSA Tracker: ${type} from ${safeName}`,
                    from_name:  safeName,
                    email:      safeEmail,
                    message,
                }),
            });

            if (response.ok) {
                setStatus('success');
                setTimeout(() => {
                    onClose();
                    setStatus('idle');
                    setMessage('');
                }, 2000);
            } else {
                setStatus('error');
            }
        } catch {
            setStatus('error');
        }
    };

    const handleClose = () => {
        onClose();
        // Reset after animation plays — cancel any pending reset first
        if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = setTimeout(() => {
            setStatus('idle');
            setMessage('');
            closeTimeoutRef.current = null;
        }, 200);
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4"
            onMouseDown={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="feedback-modal-title"
                className="bg-white dark:bg-[#0f1117] border border-slate-200 dark:border-white/5 rounded-2xl w-full max-w-lg p-8 shadow-2xl"
            >

                {status === 'success' ? (
                    <div className="text-center py-8">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                            Feedback Sent!
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Thanks for helping us improve.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {/* Header */}
                        <div className="flex justify-between items-center mb-5">
                            <h2 id="feedback-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
                                Send Feedback
                            </h2>
                            <button
                                type="button"
                                onClick={handleClose}
                                aria-label="Close feedback modal"
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Type selector */}
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">
                                    Feedback type
                                </label>
                                <div className="flex gap-2 flex-wrap">
                                    {FEEDBACK_TYPES.map((t) => (
                                        <button
                                            key={t.value}
                                            type="button"
                                            onClick={() => setType(t.value)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                                type === t.value
                                                    ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                                                    : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-300'
                                            }`}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Message */}
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1.5">
                                    Your message
                                </label>
                                <textarea
                                    required
                                    rows={6}
                                    placeholder="Tell us what's on your mind..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all resize-none"
                                />
                            </div>
                        </div>

                        {status === 'error' && (
                            <p className="mt-3 text-xs text-red-500 dark:text-red-400">
                                Something went wrong. Please try again.
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="w-full mt-5 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl transition-all text-sm font-semibold shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_22px_rgba(99,102,241,0.5)]"
                        >
                            {status === 'loading' ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                            {status === 'loading' ? 'Sending...' : 'Send Message'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default FeedbackModal;

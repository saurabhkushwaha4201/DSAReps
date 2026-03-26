import React, { useEffect, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from './AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import sendTokenToExtension from '../utils/sendToken';

export default function Login() {
    const { login, isAuthenticated, setAuthFromToken } = useAuth();
    const navigate = useNavigate();
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const redirectToken = params.get('token');
        const redirectError = params.get('error');

        if (redirectError) {
            toast.error('Authentication failed. Please try again.');
        }

        if (!redirectToken) {
            return;
        }

        setAuthFromToken(redirectToken);
        window.postMessage(
            {
                source: "DSA_DASHBOARD",
                type: "AUTH_SET_TOKEN",
                token: redirectToken,
            },
            "*"
        );
        navigate('/', { replace: true });
    }, [navigate, setAuthFromToken]);

    // Redirect if already logged in
    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    const handleSuccess = async (credentialResponse) => {
        setIsLoggingIn(true);
        // UX: Show loading toast while verifying token on backend
        const loadToast = toast.loading("Verifying credentials...");

        try {
            await login(credentialResponse.credential);
            // 🔑 READ TOKEN AFTER LOGIN
            const token = localStorage.getItem("token");
            console.log("TOKEN FROM LOCALSTORAGE:", token);

            if (token) {
                sendTokenToExtension(token);
            } else {
                console.error("TOKEN NOT FOUND IN LOCALSTORAGE");
            }
            // UX: Update toast on success
            toast.success("Success! Welcome back.", { id: loadToast });
            window.postMessage(
                {
                    source: "DSA_DASHBOARD",
                    type: "AUTH_SET_TOKEN",
                    token
                },
                "*"
            );
            navigate('/');
        } catch (error) {
            console.error('Login Failed', error);
            // UX: Update toast on error
            toast.error("Authentication failed. Please try again.", { id: loadToast });
            setIsLoggingIn(false);
        }
    };

    const handleError = () => {
        toast.error("Google sign-in was interrupted.");
        setIsLoggingIn(false);
    };

    return (
        // 1. Background Container (Dark blue gradient with subtle glows)
        <div className="relative min-h-screen flex items-center justify-center bg-[#050A18] overflow-hidden font-sans antialiased selection:bg-blue-500/30">
            {/* Ambient Glows */}
            <div className="absolute top-[-20%] left-[-10%] w-150 h-150 bg-blue-600/20 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-150 h-150 bg-indigo-800/20 rounded-full blur-[150px] pointer-events-none" />

            {/* 2. Main Login Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }} // Smooth cubic-bezier
                className="relative z-10 w-full max-w-105 p-4"
            >
                <div className="bg-[#0A1124]/90 backdrop-blur-xl border border-white/10 p-10 rounded-[2.5rem] shadow-2xl shadow-black/50">

                    {/* Header Section */}
                    <div className="flex flex-col items-center text-center mb-10">
                        {/* Logo Icon */}
                        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-b from-blue-500 to-blue-700 mb-6 shadow-lg shadow-blue-500/30 ring-1 ring-white/20">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white">
                                <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.035-.84-1.875-1.875-1.875h-.75zM9.75 8.625c-1.035 0-1.875.84-1.875 1.875v9.375c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V10.5c0-1.035-.84-1.875-1.875-1.875h-.75zM3 13.125c-1.035 0-1.875.84-1.875 1.875v4.875c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875v-4.875c0-1.035-.84-1.875-1.875-1.875h-.75z" />
                            </svg>
                        </div>
                        {/* Title & Enhanced Subtitle */}
                        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
                            DSA <span className="text-blue-500">Tracker</span>
                        </h1>
                        <p className="text-slate-400 text-[15px] font-medium leading-relaxed">
                            Systemize your prep. Crush your technical interviews.
                        </p>
                    </div>

                    {/* Enhanced Feature Rows (Pill shape) */}
                    <div className="space-y-4 mb-10">
                        <FeaturePill
                            icon={
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-orange-400">
                                    <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clipRule="evenodd" />
                                </svg>
                            }
                            text="Track Your DSA Progress"
                        />
                        <FeaturePill
                            icon={
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-pink-500">
                                    <path fillRule="evenodd" d="M2.25 13.5a8.25 8.25 0 018.25-8.25.75.75 0 01.75.75v6.75H18a.75.75 0 01.75.75 8.25 8.25 0 01-16.5 0z" clipRule="evenodd" />
                                    <path fillRule="evenodd" d="M12.75 3a.75.75 0 01.75-.75 8.25 8.25 0 018.25 8.25.75.75 0 01-.75.75h-7.5a.75.75 0 01-.75-.75V3z" clipRule="evenodd" />
                                </svg>
                            }
                            text="Master Key Coding Patterns"
                        />
                    </div>

                    {/* Login Button Area */}
                    <div className="relative">
                        <AnimatePresence mode="wait">
                            {isLoggingIn ? (
                                // Loading Spinner State
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="w-full h-12.5 rounded-full bg-blue-600/20 flex items-center justify-center gap-3 border border-blue-500/30"
                                >
                                    <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                    <span className="text-blue-100 text-sm font-semibold tracking-wide">Connecting...</span>
                                </motion.div>
                            ) : (
                                // Google Button State
                                <motion.div
                                    key="googleBtn"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    // Hover animation for the container
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full shadow-lg shadow-blue-900/20 rounded-full overflow-hidden flex justify-center"
                                >
                                    <GoogleLogin
                                        onSuccess={handleSuccess}
                                        onError={handleError}
                                        theme="filled_blue"
                                        shape="pill"
                                        size="large"
                                        width="300"
                                        text="signin_with"
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Footer */}
                    <p className="mt-8 text-center text-[10px] text-slate-500 uppercase tracking-[0.25em] font-bold">
                        Secure One-Tap Login
                    </p>
                </div>
            </motion.div>
        </div>
    );
}

// Helper Component for the Feature Rows
function FeaturePill({ icon, text }) {
    return (
        <div className="group flex items-center gap-4 px-5 py-3.5 bg-[#121A35] hover:bg-[#162041] rounded-full border border-white/5 transition-colors duration-300">
            <div className="shrink-0">
                {icon}
            </div>
            <span className="text-slate-200 text-[14px] font-semibold tracking-wide group-hover:text-white transition-colors">
                {text}
            </span>
        </div>
    );
}
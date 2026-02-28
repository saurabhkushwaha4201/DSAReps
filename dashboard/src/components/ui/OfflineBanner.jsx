import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * OfflineBanner - Shows when user loses internet connection
 * Animated banner with warning message
 */
export function OfflineBanner() {
    const isOnline = useOnlineStatus();

    return (
        <AnimatePresence>
            {!isOnline && (
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -50, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg"
                >
                    <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-center gap-3">
                        <WifiOff className="w-5 h-5 animate-pulse flex-shrink-0" />
                        <div className="flex items-center gap-2 flex-wrap justify-center">
                            <span className="font-semibold">
                                You are offline
                            </span>
                            <span className="text-amber-100 text-sm">
                                • Some features may be unavailable
                            </span>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

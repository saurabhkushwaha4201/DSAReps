import React from 'react';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';

export const FocusLayout = ({ children }) => {
    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Minimal Header */}
            <div className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-white sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                        D
                    </div>
                    <span className="font-semibold text-slate-800 tracking-tight">Focus Mode</span>
                </div>

                <Link to="/" className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-2 rounded-full transition-colors">
                    <X className="w-6 h-6" />
                </Link>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col relative">
                {children}
            </div>
        </div>
    );
};

import React from 'react';

interface GameRoundContainerProps {
    children: React.ReactNode;
    className?: string; // Allow custom background or spacing overrides
    fullWidth?: boolean;
    noTopPadding?: boolean;
}

export default function GameRoundContainer({ children, className = "", fullWidth = false, noTopPadding = false }: GameRoundContainerProps) {
    return (
        <div className={`min-h-screen w-full bg-slate-900 text-slate-100 flex flex-col overflow-y-auto ${className}`}>
            <div className={`flex-1 flex flex-col items-center justify-center p-4 md:p-6 ${!noTopPadding ? 'md:pt-[80px]' : ''} w-full ${fullWidth ? '' : 'max-w-7xl mx-auto'} my-auto`}>
                {children}
            </div>
        </div>
    );
}

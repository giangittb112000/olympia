"use client";

import { useMCSocket } from "@/hooks/socket/useMCSocket";

export default function MCGuard({ children }: { children: React.ReactNode }) {
    useMCSocket(); // Triggers connection to MC channel
    
    return (
        <>
            {children}
        </>
    );
}

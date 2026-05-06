"use client";

import { usePathname } from "next/navigation";
import { AuthGuard } from "@codeswayam/auth";

export function ConditionalAuthGuard({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    
    // List of paths that should NOT be protected by AuthGuard (public or callback paths)
    const isPublicPath = pathname.startsWith('/auth') || 
                         pathname === '/login' || 
                         pathname === '/signup' ||
                         pathname === '/public';

    if (isPublicPath) {
        return <>{children}</>;
    }

    return <AuthGuard>{children}</AuthGuard>;
}

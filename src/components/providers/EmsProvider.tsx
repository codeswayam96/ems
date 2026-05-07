"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useCSWUser, logout as cswLogout } from "@codeswayam/auth";
import { apiClient } from "@/lib/api-client";
import { AccessDenied } from "@/components/AccessDenied";
import { usePathname } from "next/navigation";

interface EmsProfile {
  ssoUserId: string;
  appRole: 'admin' | 'manager' | 'employee' | 'viewer' | 'ceo' | 'intern';
  department: string;
  theme: string;
  status: 'pending' | 'approved' | 'suspended' | 'rejected';
}

interface EmsContextType {
  user: (any & EmsProfile) | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

const EmsContext = createContext<EmsContextType | null>(null);

export function EmsProvider({ children }: { children: React.ReactNode }) {
  const { user: ssoUser, isLoaded: ssoLoaded } = useCSWUser();
  const [emsProfile, setEmsProfile] = useState<EmsProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  const fetchEmsProfile = async () => {
    try {
      const response = await apiClient.get("/ems-profile");
      setEmsProfile({
        ...response.data,
        
      });
    } catch (err) {
      console.error("Failed to fetch EMS profile", err);
    } finally {
      setLoading(false);
    }
  };

  const isAuthPath = pathname.startsWith('/auth') || pathname === '/login' || pathname === '/signup';

  useEffect(() => {
    if (isAuthPath) {
      setLoading(false);
      return;
    }
    if (!ssoLoaded) return;

    if (ssoUser) {
      fetchEmsProfile();
    } else {
      setLoading(false);
    }
  }, [ssoUser, ssoLoaded, isAuthPath]);

  const combinedUser = ssoUser && emsProfile ? { ...ssoUser, ...emsProfile } : null;

  // Access Control: Block users who are not approved
  const isApproved = emsProfile?.status === 'approved';
  const showAccessDenied = ssoUser && emsProfile && !isApproved;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (showAccessDenied) {
    return <AccessDenied status={emsProfile.status as 'pending' | 'suspended' | 'rejected'} onLogout={cswLogout} />;
  }

  // If logged in via SSO but no EMS profile (rare if fetchEmsProfile creates it)
  if (ssoUser && !emsProfile && !loading) {
     return <AccessDenied status="none" onLogout={cswLogout} />;
  }

  return (
    <EmsContext.Provider value={{ user: combinedUser, loading: loading || !ssoLoaded, refreshProfile: fetchEmsProfile, logout: cswLogout }}>
      {children}
    </EmsContext.Provider>
  );
}

export const useEmsUser = () => {
  const context = useContext(EmsContext);
  if (!context) {
    throw new Error("useEmsUser must be used within an EmsProvider");
  }
  return context;
};

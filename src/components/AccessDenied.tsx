'use client';

import { ShieldAlert, LogOut, Clock, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AccessDeniedProps {
  status: 'pending' | 'suspended' | 'rejected' | 'none';
  onLogout: () => void;
}

export function AccessDenied({ status, onLogout }: AccessDeniedProps) {
  const content = {
    pending: {
      icon: <Clock className="w-16 h-16 text-yellow-500 animate-pulse" />,
      title: "Account Pending Approval",
      description: "Your account has been created successfully. An administrator will review your request shortly. You will gain access once approved.",
      buttonText: "Refresh Status"
    },
    suspended: {
      icon: <Ban className="w-16 h-16 text-red-500" />,
      title: "Account Suspended",
      description: "Your access to the Employee Management System has been suspended. Please contact your manager or IT department for more information.",
      buttonText: "Contact Support"
    },
    rejected: {
      icon: <ShieldAlert className="w-16 h-16 text-red-600" />,
      title: "Access Request Rejected",
      description: "Your request for EMS access has been declined. If you believe this is a mistake, please reach out to the HR department.",
      buttonText: "Appeal Decision"
    },
    none: {
      icon: <ShieldAlert className="w-16 h-16 text-gray-500" />,
      title: "No EMS Profile Found",
      description: "You are logged in via SSO, but you don't have an active EMS profile. Please request access from your administrator.",
      buttonText: "Request Access"
    }
  };

  const { icon, title, description } = content[status] || content.none;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm p-4">
      <div className="max-w-md w-full bg-card border shadow-2xl rounded-2xl p-8 text-center space-y-6 transform transition-all hover:scale-[1.01]">
        <div className="flex justify-center">
          <div className="p-4 bg-muted rounded-full bg-opacity-50">
            {icon}
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground italic">
            {title}
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>

        <div className="pt-4 flex flex-col gap-3">
          <Button 
            variant="default" 
            size="lg" 
            className="w-full font-semibold shadow-lg shadow-primary/20"
            onClick={() => window.location.reload()}
          >
            Check Again
          </Button>
          
          <Button 
            variant="outline" 
            size="lg" 
            className="w-full group"
            onClick={onLogout}
          >
            <LogOut className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Logout from SSO
          </Button>
        </div>

        <div className="pt-4 text-xs text-muted-foreground uppercase tracking-widest font-medium opacity-50">
          Professional Employee Management System
        </div>
      </div>
    </div>
  );
}

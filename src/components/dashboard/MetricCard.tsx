'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { ReactNode } from 'react';

export interface MetricCardProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: ReactNode;
  colorGradient: string;
  trend?: 'up' | 'down' | 'neutral';
}

export function MetricCard({
  label,
  value,
  change,
  changeLabel,
  icon,
  colorGradient,
  trend = 'neutral',
}: MetricCardProps) {
  return (
    <Card className="border-border bg-gradient-to-br relative overflow-hidden group hover:border-border hover:shadow-md transition-all">
      <div className={`absolute inset-0 bg-gradient-to-br ${colorGradient} opacity-30`} />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <div className="p-2 rounded-lg bg-muted backdrop-blur">{icon}</div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="text-3xl font-bold text-foreground">{value}</div>
        <div className="flex items-center gap-2 mt-2">
          {change !== undefined && (
            <>
              {trend === 'up' ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : trend === 'down' ? (
                <TrendingDown className="w-4 h-4 text-red-500" />
              ) : null}
              <p
                className={`text-xs font-medium ${
                  trend === 'up'
                    ? 'text-green-600'
                    : trend === 'down'
                    ? 'text-red-600'
                    : 'text-muted-foreground'
                }`}
              >
                {trend === 'up' && '+'}
                {change}% {changeLabel || 'from last month'}
              </p>
            </>
          )}
          {!change && changeLabel && <p className="text-xs text-muted-foreground/70">{changeLabel}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

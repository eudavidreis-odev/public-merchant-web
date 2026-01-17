import React from 'react';
import { Chip } from 'react-native-paper';

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const toneStyles: Record<StatusTone, { color: string; backgroundColor: string; icon?: string }> = {
    success: { color: '#16a34a', backgroundColor: '#f0fdf4', icon: 'check-circle-outline' },
    warning: { color: '#f59e0b', backgroundColor: '#fefce8', icon: 'alert-outline' },
    danger: { color: '#ef4444', backgroundColor: '#fef2f2', icon: 'close-circle-outline' },
    info: { color: '#3b82f6', backgroundColor: '#eff6ff', icon: 'information-outline' },
    neutral: { color: '#6b7280', backgroundColor: '#f9fafb' },
};

export default function StatusBadge({ label, tone = 'neutral', onPress }: { label: string; tone?: StatusTone; onPress?: () => void }) {
    const s = toneStyles[tone];
    return (
        <Chip icon={s.icon} onPress={onPress} style={{ backgroundColor: s.backgroundColor }} textStyle={{ color: s.color, fontWeight: '700' }}>
            {label}
        </Chip>
    );
}

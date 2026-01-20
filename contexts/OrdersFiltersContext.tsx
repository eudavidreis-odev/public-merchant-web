import React, { createContext, useContext, useMemo, useState } from 'react';
import type { Order } from '../types';

export type HistoryDatePreset = 'all' | 'last7' | 'month' | 'custom';
export type CustomRange = { start: Date | null; end: Date | null };
export type OrdersSortField = 'id' | 'customerName' | 'createdAt' | 'total' | 'status';
export type OrdersSortDirection = 'asc' | 'desc';

type OrdersFiltersContextValue = {
    todayStatuses: Order['status'][];
    setTodayStatuses: React.Dispatch<React.SetStateAction<Order['status'][]>>;
    todaySearchQuery: string;
    setTodaySearchQuery: React.Dispatch<React.SetStateAction<string>>;

    historyStatuses: Order['status'][];
    setHistoryStatuses: React.Dispatch<React.SetStateAction<Order['status'][]>>;
    historySearchQuery: string;
    setHistorySearchQuery: React.Dispatch<React.SetStateAction<string>>;
    historyDatePreset: HistoryDatePreset;
    setHistoryDatePreset: React.Dispatch<React.SetStateAction<HistoryDatePreset>>;
    historyCustomRange: CustomRange;
    setHistoryCustomRange: React.Dispatch<React.SetStateAction<CustomRange>>;

    sortField: OrdersSortField;
    setSortField: React.Dispatch<React.SetStateAction<OrdersSortField>>;
    sortDirection: OrdersSortDirection;
    setSortDirection: React.Dispatch<React.SetStateAction<OrdersSortDirection>>;
};

const OrdersFiltersContext = createContext<OrdersFiltersContextValue | null>(null);

export function OrdersFiltersProvider({ children }: { children: React.ReactNode }) {
    const [todayStatuses, setTodayStatuses] = useState<Order['status'][]>([]);
    const [todaySearchQuery, setTodaySearchQuery] = useState('');

    const [historyStatuses, setHistoryStatuses] = useState<Order['status'][]>([]);
    const [historySearchQuery, setHistorySearchQuery] = useState('');
    const [historyDatePreset, setHistoryDatePreset] = useState<HistoryDatePreset>('all');
    const [historyCustomRange, setHistoryCustomRange] = useState<CustomRange>({ start: null, end: null });

    const [sortField, setSortField] = useState<OrdersSortField>('createdAt');
    const [sortDirection, setSortDirection] = useState<OrdersSortDirection>('desc');

    const value = useMemo(
        () => ({
            todayStatuses,
            setTodayStatuses,
            todaySearchQuery,
            setTodaySearchQuery,
            historyStatuses,
            setHistoryStatuses,
            historySearchQuery,
            setHistorySearchQuery,
            historyDatePreset,
            setHistoryDatePreset,
            historyCustomRange,
            setHistoryCustomRange,
            sortField,
            setSortField,
            sortDirection,
            setSortDirection,
        }),
        [
            todayStatuses,
            todaySearchQuery,
            historyStatuses,
            historySearchQuery,
            historyDatePreset,
            historyCustomRange,
            sortField,
            sortDirection,
        ]
    );

    return <OrdersFiltersContext.Provider value={value}>{children}</OrdersFiltersContext.Provider>;
}

export function useOrdersFilters() {
    const ctx = useContext(OrdersFiltersContext);
    if (!ctx) {
        throw new Error('useOrdersFilters deve ser usado dentro de OrdersFiltersProvider');
    }
    return ctx;
}

import { useEffect, useMemo, useState } from 'react';
import { auth } from '../config/firebaseConfig';
import type { Order } from '../types';
import { subscribeOrders } from './orders';
import { getProducts, type Product } from './products';

export type RevenuePoint = { value: number; label: string; dataPointText?: string };
export type CategoryPoint = { value: number; label: string; frontColor?: string };
export type MenuItemPoint = { id: string; name: string; revenue: number; volume: number; type: string };

const SUCCESS_STATUSES: Order['status'][] = ['Entregue'];

function formatBRL(value: number) {
    return `R$ ${value.toFixed(2)}`;
}

export function useFinanceMetrics(merchantIdOverride?: string) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    useEffect(() => {
        const envMerchant = process.env.EXPO_PUBLIC_MERCHANT_ID as string | undefined;
        const activeMerchantId = merchantIdOverride || auth.currentUser?.uid || envMerchant || null;
        if (!activeMerchantId) return;

        const unsub = subscribeOrders(
            (o) => setOrders(o),
            (e) => console.error('[FinanceService] Erro na assinatura de pedidos', e),
            activeMerchantId,
        );
        (async () => {
            try {
                const p = await getProducts();
                setProducts(p);
            } catch (e) {
                console.error('[FinanceService] Erro ao carregar produtos', e);
            }
        })();

        return () => unsub?.();
    }, [merchantIdOverride]);

    const last30Days = useMemo(() => {
        const days: { key: string; label: string; date: Date }[] = [];
        const now = new Date();
        for (let i = 29; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(now.getDate() - i);
            const label = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(2)}`;
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            days.push({ key, label, date: d });
        }
        return days;
    }, []);

    const revenueMonthly: RevenuePoint[] = useMemo(() => {
        const map: Record<string, number> = {};
        for (const day of last30Days) map[day.key] = 0;

        orders.forEach((o) => {
            const created = o.createdAt?.toDate?.() ?? (o.createdAt as any);
            if (!created) return;
            const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}-${String(created.getDate()).padStart(2, '0')}`;
            if (!(key in map)) return;
            if (!SUCCESS_STATUSES.includes(o.status)) return;
            map[key] += (o.total ?? 0) / 100; // total em reais
        });

        return last30Days.map((d) => ({
            label: d.label,
            value: map[d.key] || 0,
            dataPointText: formatBRL(map[d.key] || 0),
        }));
    }, [orders, last30Days]);

    const categoryRanking: CategoryPoint[] = useMemo(() => {
        if (!products.length) return [];
        const productByName = new Map<string, Product>();
        products.forEach((p) => productByName.set(p.name, p));
        const revenueByCategory = new Map<string, number>();
        const since = new Date(); since.setDate(since.getDate() - 30);

        orders.forEach((o) => {
            const created = o.createdAt?.toDate?.() ?? (o.createdAt as any);
            if (!created || created < since) return;
            if (!SUCCESS_STATUSES.includes(o.status)) return;
            o.items.forEach((it) => {
                const p = productByName.get(it.name);
                if (!p) return;
                const add = (p.price || 0) * (it.quantity || 0);
                revenueByCategory.set(p.category, (revenueByCategory.get(p.category) || 0) + add);
            });
        });

        const palette = ['#007BFF', '#4CAF50', '#FFC107', '#F44336', '#9C27B0', '#00BCD4'];
        const entries = Array.from(revenueByCategory.entries())
            .map(([label, value], idx) => ({ label, value, frontColor: palette[idx % palette.length] }))
            .sort((a, b) => b.value - a.value);
        return entries;
    }, [orders, products]);

    const menuMatrix: MenuItemPoint[] = useMemo(() => {
        if (!products.length) return [];
        const productByName = new Map<string, Product>();
        products.forEach((p) => productByName.set(p.name, p));
        const since = new Date(); since.setDate(since.getDate() - 30);

        const agg = new Map<string, { name: string; revenue: number; volume: number }>();
        orders.forEach((o) => {
            const created = o.createdAt?.toDate?.() ?? (o.createdAt as any);
            if (!created || created < since) return;
            if (!SUCCESS_STATUSES.includes(o.status)) return;
            o.items.forEach((it) => {
                const p = productByName.get(it.name);
                if (!p) return;
                const cur = agg.get(it.name) || { name: it.name, revenue: 0, volume: 0 };
                cur.revenue += (p.price || 0) * (it.quantity || 0);
                cur.volume += (it.quantity || 0);
                agg.set(it.name, cur);
            });
        });

        const arr = Array.from(agg.entries()).map(([name, v]) => ({ id: name, name, revenue: v.revenue, volume: v.volume }));
        if (!arr.length) return [];
        const revs = arr.map(a => a.revenue).sort((a, b) => a - b);
        const vols = arr.map(a => a.volume).sort((a, b) => a - b);
        const revThresh = revs[Math.floor(revs.length * 0.8)];
        const volThresh = vols[Math.floor(vols.length * 0.8)];
        const revMedian = revs[Math.floor(revs.length * 0.5)];
        const volMedian = vols[Math.floor(vols.length * 0.5)];

        const typed = arr.map(a => {
            let type = 'Normal';
            if (a.revenue >= revThresh) type = 'Campeão';
            else if (a.volume >= volThresh) type = 'Popular';
            else if (a.revenue >= revMedian && a.volume <= volMedian) type = 'Promissor';
            else if (a.revenue <= revMedian && a.volume <= volMedian) type = 'Dorminhoco';
            return { ...a, type } as MenuItemPoint;
        }).sort((a, b) => b.revenue - a.revenue);

        return typed;
    }, [orders, products]);

    return {
        revenueMonthly,
        categoryRanking,
        menuMatrix,
        isLoading: !orders.length && !products.length,
    };
}

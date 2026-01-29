import { useEffect, useMemo, useState } from 'react';
import { auth } from '../config/firebaseConfig';
import type { Order } from '../types';
import { subscribeOrders } from './orders';
import { getProducts, type Product } from './products';

export type RevenuePoint = { value: number; label: string; dataPointText?: string };
export type CategoryPoint = { value: number; label: string; frontColor?: string };
export type MenuItemPoint = { id: string; name: string; revenue: number; volume: number; type: string };

// TODO: Adicionar seção na tela de finanças para análise de:
// - Pedidos cancelados (valor perdido, motivos)
// - Pedidos aguardando pagamento (valor em espera)
// - Taxa de conversão (pagos vs cancelados)
// - Comparativo de receita entregue vs total pago
const SUCCESS_STATUSES: Order['status'][] = ['Entregue'];

function formatBRL(value: number) {
    return `R$ ${value.toFixed(2)}`;
}


export type FinancePeriod = 'month' | 'today' | 'week' | '30d' | 'custom';
export type CustomRange = { start: Date | null, end: Date | null };

function getPeriodRange(period: FinancePeriod, customRange?: CustomRange): { start: Date, end: Date } {
    const now = new Date();
    let start: Date;
    let end: Date = new Date(now);
    switch (period) {
        case 'today':
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
        case 'week':
            start = new Date(now);
            start.setDate(now.getDate() - now.getDay());
            break;
        case '30d':
            start = new Date(now);
            start.setDate(now.getDate() - 29);
            break;
        case 'custom':
            if (customRange?.start && customRange?.end) {
                start = new Date(customRange.start);
                end = new Date(customRange.end);
            } else {
                start = new Date(now);
            }
            break;
        case 'month':
        default:
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
    }
    // Ajuste para incluir o dia final inteiro
    end.setHours(23, 59, 59, 999);
    return { start, end };
}

export function useFinanceMetrics(
    merchantIdOverride?: string,
    period: FinancePeriod = 'month',
    customRange?: CustomRange
) {
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

    // Gera os dias do período selecionado
    const daysInPeriod = useMemo(() => {
        const { start, end } = getPeriodRange(period, customRange);
        const days: { key: string; label: string; date: Date }[] = [];
        const d = new Date(start);
        while (d <= end) {
            const label = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(2)}`;
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            days.push({ key, label, date: new Date(d) });
            d.setDate(d.getDate() + 1);
        }
        return days;
    }, [period, customRange]);

    const revenueMonthly: RevenuePoint[] = useMemo(() => {
        if (period === 'today') {
            const { start, end } = getPeriodRange(period, customRange);
            const byHour = new Map<number, number>();

            orders.forEach((o) => {
                const created = o.createdAt?.toDate?.() ?? (o.createdAt as any);
                if (!created) return;
                if (created < start || created > end) return;
                if (!SUCCESS_STATUSES.includes(o.status)) return;

                const hour = created.getHours();
                byHour.set(hour, (byHour.get(hour) || 0) + (o.total ?? 0) / 100);
            });

            // Série fixa (00h–23h) para manter espaçamento consistente e sem scroll.
            const points: RevenuePoint[] = [];
            for (let h = 0; h < 24; h += 1) {
                const v = byHour.get(h) || 0;
                points.push({
                    label: h === 23 ? '23:59' : `${String(h).padStart(2, '0')}h`,
                    value: v,
                    dataPointText: formatBRL(v),
                });
            }
            return points;
        }

        const map: Record<string, number> = {};
        for (const day of daysInPeriod) map[day.key] = 0;

        const { start, end } = getPeriodRange(period, customRange);

        orders.forEach((o) => {
            const created = o.createdAt?.toDate?.() ?? (o.createdAt as any);
            if (!created) return;
            if (created < start || created > end) return;
            const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}-${String(created.getDate()).padStart(2, '0')}`;
            if (!(key in map)) return;
            if (!SUCCESS_STATUSES.includes(o.status)) return;
            map[key] += (o.total ?? 0) / 100; // total em reais
        });

        return daysInPeriod.map((d) => ({
            label: d.label,
            value: map[d.key] || 0,
            dataPointText: formatBRL(map[d.key] || 0),
        }));
    }, [orders, daysInPeriod, period, customRange]);

    const categoryRanking: CategoryPoint[] = useMemo(() => {
        if (!products.length) return [];
        const productByName = new Map<string, Product>();
        products.forEach((p) => productByName.set(p.name, p));
        const revenueByCategory = new Map<string, number>();
        const { start, end } = getPeriodRange(period, customRange);

        orders.forEach((o) => {
            const created = o.createdAt?.toDate?.() ?? (o.createdAt as any);
            if (!created || created < start || created > end) return;
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
    }, [orders, products, period, customRange]);

    const menuMatrix: MenuItemPoint[] = useMemo(() => {
        if (!products.length) return [];
        const productByName = new Map<string, Product>();
        products.forEach((p) => productByName.set(p.name, p));
        const { start, end } = getPeriodRange(period, customRange);

        const agg = new Map<string, { name: string; revenue: number; volume: number }>();
        orders.forEach((o) => {
            const created = o.createdAt?.toDate?.() ?? (o.createdAt as any);
            if (!created || created < start || created > end) return;
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
    }, [orders, products, period, customRange]);

    return {
        revenueMonthly,
        categoryRanking,
        menuMatrix,
        isLoading: !orders.length && !products.length,
    };
}

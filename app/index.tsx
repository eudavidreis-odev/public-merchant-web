import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { DataTable, Text } from 'react-native-paper';
import OrderStatusChip from '../components/OrderStatusChip';
import { CARD_PADDING } from '../constants/card';
import { useOrdersFilters } from '../contexts/OrdersFiltersContext';
import * as OrdersService from '../services/orders';
import { textSpacing, typography } from '../styles/theme';
import type { Order } from '../types';
import { getOrderStatusStyle, ORDER_STATUSES } from '../types/orderStatus';

function formatBRLFromCentavos(total_centavos: number): string {
  if (typeof total_centavos !== 'number') return 'R$ 0,00';
  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(total_centavos / 100);
  } catch {
    const fixed = (total_centavos / 100).toFixed(2).replace('.', ',');
    return `R$ ${fixed}`;
  }
}

function formatDate(ts?: any): string {
  if (!ts) return '-';
  try {
    const d = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return '-';
  }
}

const KpiCard = ({ title, value, onPress }: { title: string; value: string; onPress?: () => void }) => (
  <Pressable style={({ pressed }) => [styles.kpiCard, pressed && { opacity: 0.7 }]} onPress={onPress} android_ripple={{ color: '#eee' }}>
    <Text style={styles.kpiTitle}>{title}</Text>
    <Text style={styles.kpiValue}>{value}</Text>
  </Pressable>
);

export default function DashboardScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const router = useRouter();
  const { setTodayStatuses } = useOrdersFilters();

  useEffect(() => {
    const unsub = OrdersService.subscribeOrders(
      (list) => setOrders(list),
      (err) => console.error('[Dashboard] Erro ao carregar pedidos:', err)
    );
    return () => unsub();
  }, []);

  const todaysOrders = useMemo(() => {
    const now = new Date();
    const isToday = (ts?: any) => {
      if (!ts) return false;
      const d = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts);
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    };
    return orders.filter((o) => isToday(o.createdAt));
  }, [orders]);

  const last30Orders = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const inLast30Days = (ts?: any) => {
      if (!ts) return false;
      const d = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts);
      return d >= start && d <= now;
    };
    return orders.filter((o) => inLast30Days(o.createdAt));
  }, [orders]);

  const kpis = useMemo(() => {
    // Receita confirmada: apenas pedidos entregues
    const deliveredOrders = todaysOrders.filter((o) => o.status === 'Entregue');
    const revenueCents = deliveredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const ticketMedioCents = deliveredOrders.length ? Math.round(revenueCents / deliveredOrders.length) : 0;

    // Projeção: pedidos pagos e em andamento (após "Pago")
    const paidStatuses: Order['status'][] = ['Pago', 'Preparando', 'Pronto', 'Em entrega', 'Entregue'];
    const paidOrders = todaysOrders.filter((o) => paidStatuses.includes(o.status));
    const projecaoCents = paidOrders.reduce((sum, o) => sum + (o.total || 0), 0);

    const delivered30d = last30Orders.filter((o) => o.status === 'Entregue');
    const revenue30dCents = delivered30d.reduce((sum, o) => sum + (o.total || 0), 0);

    return {
      faturamentoDia: formatBRLFromCentavos(revenueCents),
      projecaoDia: formatBRLFromCentavos(projecaoCents),
      ticketMedio: formatBRLFromCentavos(ticketMedioCents),
      faturamento30d: formatBRLFromCentavos(revenue30dCents),
    };
  }, [todaysOrders, last30Orders]);

  const ordersByStatus = useMemo(() => {
    const counts = ORDER_STATUSES.reduce((acc, status) => {
      acc[status] = 0;
      return acc;
    }, {} as Record<Order['status'], number>);

    for (const o of todaysOrders) {
      if (typeof counts[o.status] === 'number') {
        counts[o.status] += 1;
      }
    }
    return counts;
  }, [todaysOrders]);

  const recentOrders = useMemo(() => {
    return orders.slice(0, 10);
  }, [orders]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.subtitle}>
        Visão geral do desempenho do seu negócio em tempo real.
      </Text>

      {/* Card de Finanças */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Finanças</Text>
        <Text style={styles.sectionDescription}>Resumo financeiro do dia.</Text>
        <View style={styles.kpiRow}>
          <KpiCard
            title="Faturamento (Hoje)"
            value={kpis.faturamentoDia}
            onPress={() => router.push({ pathname: '/finance', params: { period: 'today' } })}
          />
          <KpiCard
            title="Projeção (Hoje)"
            value={kpis.projecaoDia}
            onPress={() => router.push({ pathname: '/finance', params: { period: 'today' } })}
          />
          <KpiCard
            title="Ticket Médio"
            value={kpis.ticketMedio}
            onPress={() => router.push({ pathname: '/finance', params: { period: 'today' } })}
          />
          <KpiCard
            title="Faturamento (30d)"
            value={kpis.faturamento30d}
            onPress={() => router.push({ pathname: '/finance', params: { period: '30d' } })}
          />
        </View>
      </View>

      {/* Card de Pedidos por Status */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Pedidos por Status</Text>
        <Text style={styles.sectionDescription}>Contagem de pedidos de hoje por etapa. Toque em um status para filtrar.</Text>
        <View style={styles.statusSummaryRow}>
          {ORDER_STATUSES.map((status) => {
            const c = getOrderStatusStyle(status);
            const count = ordersByStatus[status] ?? 0;
            return (
              <Pressable
                key={status}
                style={({ pressed }) => StyleSheet.flatten([
                  styles.statusSummaryItem,
                  { backgroundColor: c.bg, borderColor: c.fg },
                  pressed && { opacity: 0.7 },
                ])}
                onPress={() => {
                  setTodayStatuses([status]);
                  router.push('/orders');
                }}
                android_ripple={{ color: c.fg, borderless: false }}
              >
                <MaterialCommunityIcons name={c.icon as any} size={18} color={c.fg} />
                <Text style={StyleSheet.flatten([styles.statusSummaryCount, { color: c.fg }])}>
                  {count}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Recent Orders */}
      <Pressable
        style={({ pressed }) => [styles.card, { marginTop: 8 }, pressed && { opacity: 0.92 }]}
        onPress={() => router.push('/orders')}
        android_ripple={{ color: '#eee' }}
      >
        <Text style={styles.sectionTitle}>Pedidos Recentes</Text>
        <Text style={styles.sectionDescription}>Últimos 10 pedidos (inclui qualquer status).</Text>
        {recentOrders.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum pedido encontrado.</Text>
        ) : (
          <DataTable>
            <DataTable.Header>
              <DataTable.Title style={{ flex: 2 }}>Cliente / ID</DataTable.Title>
              <DataTable.Title numeric>Valor</DataTable.Title>
              <DataTable.Title style={{ flex: 1.2 }}>Status</DataTable.Title>
              <DataTable.Title style={{ flex: 1.2 }}>Tempo</DataTable.Title>
            </DataTable.Header>
            {recentOrders.map((o) => (
              <DataTable.Row
                key={o.id}
                onPress={() =>
                  router.push({
                    pathname: '/orders/[orderId]',
                    params: { orderId: o.id, merchantId: o.merchantId, returnTo: 'dashboard' },
                  })
                }
              >
                <DataTable.Cell style={{ flex: 2 }}>
                  <Text style={{ fontWeight: '600' }}>{o.customerName + ' - ' || 'Cliente -'}</Text>
                  <Text style={{ color: '#6b7280' }}>#{o.id.substring(0, 6)}</Text>
                </DataTable.Cell>
                <DataTable.Cell numeric>
                  {formatBRLFromCentavos(o.total)}
                </DataTable.Cell>
                <DataTable.Cell style={{ flex: 1.2 }}>
                  <OrderStatusChip status={o.status} />
                </DataTable.Cell>
                <DataTable.Cell style={{ flex: 1.2 }}>
                  {formatDate(o.createdAt)}
                </DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f4f4f4',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: CARD_PADDING,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    // Elevação/sombra
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  title: {
    marginBottom: textSpacing.pageTitle,
    fontSize: typography.pageTitle,
    fontWeight: '700',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  kpiCard: {
    flexGrow: 1,
    minWidth: 200,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    elevation: 1,
  },
  kpiTitle: {
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: typography.heading3,
    fontWeight: '700',
    color: '#111827',
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: typography.cardTitle,
    fontWeight: '700',
    marginBottom: 2,
  },
  sectionDescription: {
    opacity: 0.7,
    marginBottom: textSpacing.cardDescription,
    fontSize: typography.subtitle,
  },
  statusSummaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statusSummaryItem: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    flexGrow: 1,
    flexBasis: 110,
    minWidth: 110,
    justifyContent: 'center',
  },
  statusSummaryCount: {
    fontWeight: '800',
    fontSize: typography.heading3,
  },
  subtitle: {
    opacity: 0.7,
    marginBottom: textSpacing.cardDescription,
    fontSize: typography.subtitle,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginVertical: 24,
    fontSize: typography.heading5,
  },
});

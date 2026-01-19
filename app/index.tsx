import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { DataTable, Text } from 'react-native-paper';
import OrderStatusChip from '../components/OrderStatusChip';
import { CARD_PADDING } from '../constants/card';
import * as OrdersService from '../services/orders';
import { textSpacing, typography } from '../styles/theme';
import type { Order } from '../types';

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

const ACTIVE_STATUSES: Order['status'][] = [
  'Criado',
  'Confirmado',
  'Preparando',
  'Pronto',
  'Em entrega',
];

const KpiCard = ({ title, value, onPress }: { title: string; value: string; onPress?: () => void }) => (
  <Pressable style={({ pressed }) => [styles.kpiCard, pressed && { opacity: 0.7 }]} onPress={onPress} android_ripple={{ color: '#eee' }}>
    <Text style={styles.kpiTitle}>{title}</Text>
    <Text style={styles.kpiValue}>{value}</Text>
  </Pressable>
);

export default function DashboardScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const router = useRouter();

  useEffect(() => {
    const unsub = OrdersService.subscribeOrders(
      (list) => setOrders(list),
      (err) => console.error('[Dashboard] Erro ao carregar pedidos:', err)
    );
    return () => unsub();
  }, []);

  const kpis = useMemo(() => {
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

    const todays = orders.filter((o) => isToday(o.createdAt));
    const revenueCents = todays.reduce((sum, o) => sum + (o.total || 0), 0);
    const activeCount = orders.filter((o) => ACTIVE_STATUSES.includes(o.status)).length;
    const ticketMedioCents = todays.length ? Math.round(revenueCents / todays.length) : 0;
    const totalPedidosHoje = todays.length;

    return {
      faturamentoDia: formatBRLFromCentavos(revenueCents),
      pedidosAtivos: String(activeCount),
      ticketMedio: formatBRLFromCentavos(ticketMedioCents),
      totalPedidos: String(totalPedidosHoje),
    };
  }, [orders]);

  const recentActive = useMemo(() => {
    return orders
      .filter((o) => ACTIVE_STATUSES.includes(o.status))
      .slice(0, 5);
  }, [orders]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.subtitle}>
        Visão geral do desempenho do seu negócio em tempo real.
      </Text>

      {/* KPIs */}
      <View style={styles.card}>
        <View style={styles.kpiRow}>
          <KpiCard title="Faturamento (Hoje)" value={kpis.faturamentoDia} onPress={() => router.push('/finance')} />
          <KpiCard title="Pedidos Ativos" value={kpis.pedidosAtivos} onPress={() => router.push('/orders')} />
          <KpiCard title="Ticket Médio" value={kpis.ticketMedio} onPress={() => router.push('/finance')} />
          <KpiCard title="Pedidos (Hoje)" value={kpis.totalPedidos} onPress={() => router.push('/orders')} />
        </View>
      </View>

      {/* Recent Orders */}
      <View style={[styles.card, { marginTop: 8 }]}>
        <Text style={styles.sectionTitle}>Pedidos Recentes</Text>
        {recentActive.length === 0 ? (
          <Text style={styles.emptyText}>Não há pedidos ativos no momento.</Text>
        ) : (
          <DataTable>
            <DataTable.Header>
              <DataTable.Title style={{ flex: 2 }}>Cliente / ID</DataTable.Title>
              <DataTable.Title numeric>Valor</DataTable.Title>
              <DataTable.Title style={{ flex: 1.2 }}>Status</DataTable.Title>
              <DataTable.Title style={{ flex: 1.2 }}>Tempo</DataTable.Title>
            </DataTable.Header>
            {recentActive.map((o) => (
              <DataTable.Row key={o.id}>
                <DataTable.Cell style={{ flex: 2 }}>
                  <Text style={{ fontWeight: '600' }}>{o.customerName || 'Cliente'}</Text>
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
      </View>
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
    marginBottom: 20,
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
    marginBottom: textSpacing.cardTitle,
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

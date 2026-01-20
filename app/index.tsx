import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { DataTable, Text } from 'react-native-paper';
import OrderStatusChip, { getOrderStatusStyle } from '../components/OrderStatusChip';
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

const ORDER_STATUSES: Order['status'][] = [
  'Criado',
  'Confirmado',
  'Preparando',
  'Pronto',
  'Em entrega',
  'Entregue',
  'Cancelado',
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

  const kpis = useMemo(() => {
    const revenueCents = todaysOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const ticketMedioCents = todaysOrders.length ? Math.round(revenueCents / todaysOrders.length) : 0;

    return {
      faturamentoDia: formatBRLFromCentavos(revenueCents),
      ticketMedio: formatBRLFromCentavos(ticketMedioCents),
    };
  }, [todaysOrders]);

  const ordersByStatus = useMemo(() => {
    const counts: Record<Order['status'], number> = {
      Criado: 0,
      Confirmado: 0,
      Preparando: 0,
      Pronto: 0,
      'Em entrega': 0,
      Entregue: 0,
      Cancelado: 0,
    };
    for (const o of todaysOrders) {
      if (o.status in counts) {
        counts[o.status] += 1;
      }
    }
    return counts;
  }, [todaysOrders]);

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

      {/* Card de Finanças */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Finanças</Text>
        <Text style={styles.sectionDescription}>Resumo financeiro do dia.</Text>
        <View style={styles.kpiRow}>
          <KpiCard title="Faturamento (Hoje)" value={kpis.faturamentoDia} onPress={() => router.push('/finance')} />
          <KpiCard title="Ticket Médio" value={kpis.ticketMedio} onPress={() => router.push('/finance')} />
        </View>
      </View>

      {/* Card de Pedidos por Status */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Pedidos por Status</Text>
        <Text style={styles.sectionDescription}>Contagem de pedidos de hoje por etapa.</Text>
        <View style={styles.statusSummaryRow}>
          {ORDER_STATUSES.map((status) => {
            const c = getOrderStatusStyle(status);
            const count = ordersByStatus[status] ?? 0;
            return (
              <View
                key={status}
                style={StyleSheet.flatten([
                  styles.statusSummaryItem,
                  { backgroundColor: c.bg, borderColor: c.fg },
                ])}
              >
                <MaterialCommunityIcons name={c.icon as any} size={18} color={c.fg} />
                <Text style={StyleSheet.flatten([styles.statusSummaryCount, { color: c.fg }])}>
                  {count}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Recent Orders */}
      <View style={[styles.card, { marginTop: 8 }]}>
        <Text style={styles.sectionTitle}>Pedidos Recentes</Text>
        <Text style={styles.sectionDescription}>Últimos pedidos em andamento.</Text>
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

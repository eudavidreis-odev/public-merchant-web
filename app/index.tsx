import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { DataTable, Text } from 'react-native-paper';
import OrderStatusChip from '../components/OrderStatusChip';
import * as OrdersService from '../services/orders';
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

const KpiCard = ({ title, value }: { title: string; value: string }) => (
  <View style={styles.kpiCard}>
    <Text style={styles.kpiTitle}>{title}</Text>
    <Text style={styles.kpiValue}>{value}</Text>
  </View>
);

export default function DashboardScreen() {
  const [orders, setOrders] = useState<Order[]>([]);

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

      {/* KPIs */}
      <View style={styles.kpiRow}>
        <KpiCard title="Faturamento (Hoje)" value={kpis.faturamentoDia} />
        <KpiCard title="Pedidos Ativos" value={kpis.pedidosAtivos} />
        <KpiCard title="Ticket Médio" value={kpis.ticketMedio} />
        <KpiCard title="Pedidos (Hoje)" value={kpis.totalPedidos} />
      </View>

      {/* Recent Orders */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pedidos Recentes</Text>
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
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    marginBottom: 16,
    fontSize: 26,
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
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
});

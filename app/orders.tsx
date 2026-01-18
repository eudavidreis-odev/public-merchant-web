import { Link, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  DataTable,
  Dialog,
  IconButton,
  Portal,
  Text,
  TextInput,
  Title,
  useTheme,
} from 'react-native-paper';
import OrderStatusChip from '../components/OrderStatusChip';
import * as OrdersService from '../services/orders';
import type { Order } from '../types';

const ORDER_STATUSES: Order['status'][] = [
  'Criado',
  'Confirmado',
  'Preparando',
  'Pronto',
  'Em entrega',
  'Entregue',
  'Cancelado',
];

const ACTIVE_STATUSES: Order['status'][] = [
  'Criado',
  'Confirmado',
  'Preparando',
  'Pronto',
  'Em entrega',
];

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

function formatDate(timestamp?: any): string {
  if (!timestamp) return '-';
  try {
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      // year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch (e) {
    return 'Data inválida';
  }
}

export default function OrdersScreen() {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState<Record<string, boolean>>({});
  const [confirmChange, setConfirmChange] = useState<{ order: Order; newStatus: Order['status'] } | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  // Tabs: 'active' | 'history'
  const [filter, setFilter] = useState<'active' | 'history'>('active');
  // Toolbar: busca e data
  const [searchQuery, setSearchQuery] = useState('');
  const [datePreset, setDatePreset] = useState<'all' | 'today' | 'last7' | 'month'>('all');
  const router = useRouter();
  const theme = useTheme();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = OrdersService.subscribeOrders(
      (newOrders) => {
        console.log('[OrdersScreen] Recebidos', newOrders.length, 'pedidos do serviço.');
        setAllOrders(newOrders);
        setLoading(false);
      },
      (error) => {
        console.error('Erro ao buscar pedidos:', error);
        Alert.alert('Erro', 'Não foi possível carregar os pedidos.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredOrders = useMemo(() => {
    let base = filter === 'active'
      ? allOrders.filter((order) => ACTIVE_STATUSES.includes(order.status))
      : allOrders.filter((order) => !ACTIVE_STATUSES.includes(order.status));

    // Busca por ID ou nome do cliente (case-insensitive)
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.trim().toLowerCase();
      base = base.filter((o) => {
        const name = (o.customerName || '').toLowerCase();
        return name.includes(q) || o.id.toLowerCase().includes(q);
      });
    }

    // Filtro de data por presets
    const now = new Date();
    if (datePreset !== 'all') {
      base = base.filter((o) => {
        if (!o.createdAt) return false;
        const d = typeof (o.createdAt as any).toDate === 'function'
          ? (o.createdAt as any).toDate()
          : new Date(o.createdAt as any);

        if (datePreset === 'today') {
          return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
        }
        if (datePreset === 'last7') {
          const diffMs = now.getTime() - d.getTime();
          const diffDays = diffMs / (1000 * 60 * 60 * 24);
          return diffDays <= 7;
        }
        if (datePreset === 'month') {
          return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
        }
        return true;
      });
    }

    console.log('[OrdersScreen] Após filtros:', {
      filter,
      searchQuery,
      datePreset,
      count: base.length,
    });

    return base;
  }, [allOrders, filter, searchQuery, datePreset]);

  const openMenu = (orderId: string) =>
    setMenuVisible((prev) => ({ ...prev, [orderId]: true }));

  const closeMenu = (orderId: string) =>
    setMenuVisible((prev) => ({ ...prev, [orderId]: false }));

  const requestStatusChange = (order: Order, newStatus: Order['status']) => {
    closeMenu(order.id);
    setConfirmChange({ order, newStatus });
  };

  const confirmStatusChange = async () => {
    if (!confirmChange) return;
    const { order, newStatus } = confirmChange;
    try {
      setUpdatingStatus(true);
      if (!order.merchantId) {
        throw new Error('Merchant ID não encontrado para este pedido.');
      }
      await OrdersService.updateOrderStatus(order.merchantId, order.id, newStatus);
      setConfirmChange(null);
    } catch (error) {
      console.error('Erro ao atualizar status do pedido:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
      Alert.alert('Erro', `Falha ao atualizar status: ${errorMessage}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleRowPress = (order: Order) => {
    // Futuramente, navegar para uma tela de detalhes do pedido
    console.log('Navegar para detalhes do pedido:', order.id);
    // router.push(`/order/${order.id}`);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator animating={true} size="large" />
        <Text style={styles.loadingText}>Carregando pedidos...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Title style={styles.title}>Gerenciamento de Pedidos</Title>

      {/* Tabs customizadas */}
      <View style={styles.tabsContainer}>
        {[
          { key: 'active', label: 'Em Andamento' },
          { key: 'history', label: 'Histórico' },
        ].map((t) => (
          <Pressable
            key={t.key}
            onPress={() => setFilter(t.key as 'active' | 'history')}
            style={StyleSheet.flatten([
              styles.tab,
              filter === t.key && styles.tabActive,
            ])}
          >
            <Text style={StyleSheet.flatten([
              styles.tabLabel,
              filter === t.key && styles.tabLabelActive,
            ])}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Toolbar com busca e filtro de data */}
      <View style={styles.toolbar}>
        <View style={{ flex: 1 }}>
          <TextInput
            mode="outlined"
            placeholder="Buscar por ID ou Cliente"
            value={searchQuery}
            onChangeText={(txt) => setSearchQuery(txt)}
          />
        </View>

        <View style={styles.datePresetContainer}>
          {[
            { key: 'all', label: 'Todos' },
            { key: 'today', label: 'Hoje' },
            { key: 'last7', label: 'Últimos 7 dias' },
            { key: 'month', label: 'Este mês' },
          ].map((p) => (
            <Pressable
              key={p.key}
              onPress={() => setDatePreset(p.key as 'all' | 'today' | 'last7' | 'month')}
              style={StyleSheet.flatten([
                styles.presetChip,
                datePreset === p.key && styles.presetChipActive,
              ])}
            >
              <Text style={StyleSheet.flatten([
                styles.presetLabel,
                datePreset === p.key && styles.presetLabelActive,
              ])}>{p.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <DataTable>
        <DataTable.Header style={styles.header}>
          <DataTable.Title style={StyleSheet.flatten([styles.headerCell, { flex: 2 }])}>
            <Text>Pedido / Cliente</Text>
          </DataTable.Title>
          <DataTable.Title style={StyleSheet.flatten([styles.headerCell, { flex: 1.2 }])}>
            <Text>Data</Text>
          </DataTable.Title>
          <DataTable.Title style={styles.headerCell} numeric>
            <Text>Total</Text>
          </DataTable.Title>
          <DataTable.Title style={StyleSheet.flatten([styles.headerCell, { flex: 1.5 }])}>
            <Text>Status</Text>
          </DataTable.Title>
          <DataTable.Title style={styles.headerCell} numeric>
            <Text>Ações</Text>
          </DataTable.Title>
        </DataTable.Header>

        {filteredOrders.map((order) => (
          <Pressable key={order.id} onPress={() => handleRowPress(order)}>
            {({ hovered }) => (
              <DataTable.Row
                style={StyleSheet.flatten([
                  styles.row,
                  hovered && { backgroundColor: theme.colors.surfaceVariant },
                ])}>
                <DataTable.Cell style={{ flex: 2 }}>
                  <View>
                    <Text variant="labelMedium">{`#${order.id.substring(0, 5)}`}</Text>
                    <Text
                      variant="bodySmall"
                      style={{
                        color: theme.colors.onSurfaceVariant,
                        fontStyle:
                          order.customerName === 'Cliente não identificado'
                            ? 'italic'
                            : 'normal',
                      }}>
                      {order.customerName === 'Cliente não identificado'
                        ? 'Cliente Visitante'
                        : order.customerName}
                    </Text>
                  </View>
                </DataTable.Cell>
                <DataTable.Cell style={{ flex: 1.2 }}>
                  {formatDate(order.createdAt)}
                </DataTable.Cell>
                <DataTable.Cell numeric>
                  {formatBRLFromCentavos(order.total)}
                </DataTable.Cell>
                <DataTable.Cell style={{ flex: 1.5 }}>
                  <OrderStatusChip
                    status={order.status}
                    onPress={() => openMenu(order.id)}
                  />
                  {menuVisible[order.id] && (
                    <Portal>
                      <View style={styles.statusMenuOverlay}>
                        <View style={styles.statusMenuCard}>
                          {ORDER_STATUSES.map((status) => (
                            <Pressable
                              key={status}
                              onPress={() => requestStatusChange(order, status)}
                              style={styles.statusMenuItem}
                            >
                              <Text>{status}</Text>
                            </Pressable>
                          ))}
                          <Pressable onPress={() => closeMenu(order.id)} style={styles.statusMenuClose}>
                            <Text style={{ color: '#6b7280' }}>Fechar</Text>
                          </Pressable>
                        </View>
                      </View>
                    </Portal>
                  )}
                </DataTable.Cell>
                <DataTable.Cell numeric>
                  <Link
                    href={{
                      pathname: '/chat/[orderId]',
                      params: { orderId: order.id, merchantId: order.merchantId },
                    }}
                    asChild>
                    <IconButton icon="chat-outline" size={20} />
                  </Link>
                  <IconButton icon="chevron-right" size={20} />
                </DataTable.Cell>
              </DataTable.Row>
            )}
          </Pressable>
        ))}

        {filteredOrders.length === 0 && !loading && (
          <View style={styles.noOrdersContainer}>
            <Text style={styles.noOrdersText}>
              Nenhum pedido encontrado para este filtro.
            </Text>
          </View>
        )}
      </DataTable>
    </ScrollView>
  );
}

// Modal de confirmação de alteração de status
function ConfirmStatusDialog({ visible, onDismiss, onConfirm, updating, order, newStatus }: {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: () => void;
  updating: boolean;
  order?: Order;
  newStatus?: Order['status'];
}) {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>Confirmar alteração de status</Dialog.Title>
        <Dialog.Content>
          <Text>
            {order && newStatus
              ? `Deseja alterar o pedido #${order.id.substring(0, 6)} para "${newStatus}"?`
              : 'Confirmar alteração de status?'}
          </Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss} disabled={updating}>Cancelar</Button>
          <Button mode="contained" onPress={onConfirm} loading={updating} disabled={updating}>Confirmar</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    marginBottom: 12,
    fontSize: 26,
    fontWeight: '700',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 8,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#f3f4f6',
  },
  tabLabel: {
    color: '#6b7280',
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#111827',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  datePresetContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  presetChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#f3f4f6',
  },
  presetChipActive: {
    backgroundColor: '#e5e7eb',
  },
  presetLabel: {
    color: '#374151',
    fontWeight: '600',
  },
  presetLabelActive: {
    color: '#111827',
  },
  header: {
    backgroundColor: '#f7f7f7',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerCell: {
    paddingHorizontal: 8,
  },
  row: {
    minHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statusMenuOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 50,
    paddingTop: 8,
  },
  statusMenuCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    minWidth: 160,
  },
  statusMenuItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  statusMenuClose: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
  },
  noOrdersContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noOrdersText: {
    textAlign: 'center',
  },
});

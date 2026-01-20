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
import { spacing, textSpacing, typography } from '../styles/theme';
import type { Order } from '../types';
import './global.css';

const ORDER_STATUSES: Order['status'][] = [
  'Aguardando pagamento',
  'Pago',
  'Preparando',
  'Pronto',
  'Em entrega',
  'Entregue',
  'Cancelado',
];

const ACTIVE_STATUSES: Order['status'][] = [
  'Aguardando pagamento',
  'Pago',
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
  // Ordenação
  type SortField = 'id' | 'customerName' | 'createdAt' | 'total' | 'status';
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  // Filtro de status
  const [activeStatuses, setActiveStatuses] = useState<Order['status'][]>([]);
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

    // Filtro por status (chips)
    if (activeStatuses.length > 0) {
      base = base.filter((o) => activeStatuses.includes(o.status));
    }

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

    // Ordenação
    const sorted = [...base].sort((a, b) => {
      let aValue: any;
      let bValue: any;
      switch (sortField) {
        case 'id':
          aValue = a.id;
          bValue = b.id;
          break;
        case 'customerName':
          aValue = a.customerName || '';
          bValue = b.customerName || '';
          break;
        case 'createdAt': {
          const getDate = (val: any) => {
            if (!val) return new Date(0);
            if (typeof val.toDate === 'function') return val.toDate();
            if (typeof val === 'string' || typeof val === 'number') return new Date(val);
            if (val instanceof Date) return val;
            return new Date(0);
          };
          aValue = getDate(a.createdAt);
          bValue = getDate(b.createdAt);
          break;
        }
        case 'total':
          aValue = a.total || 0;
          bValue = b.total || 0;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
      }
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [allOrders, filter, searchQuery, datePreset, sortField, sortDirection, activeStatuses]);

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
    <>
      <ScrollView style={styles.container}>
        <Title style={styles.title}>Gerenciamento de Pedidos</Title>
        <Text style={styles.subtitle}>
          Acompanhe e gerencie os pedidos recebidos em tempo real.
        </Text>

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

        {/* Chips de filtro de status */}
        <View style={styles.chipsContainer}>
          {ORDER_STATUSES.map((status) => (
            <OrderStatusChip
              key={status}
              status={status}
              selected={activeStatuses.includes(status)}
              onPress={() => {
                setActiveStatuses((prev) =>
                  prev.includes(status)
                    ? prev.filter((s) => s !== status)
                    : [...prev, status]
                );
              }}
              style={{ marginRight: spacing.xs, marginBottom: spacing.xs }}
            />
          ))}
          {activeStatuses.length > 0 && (
            <Button mode="text" onPress={() => setActiveStatuses([])} style={{ marginLeft: 8 }} compact>
              Limpar filtros
            </Button>
          )}
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
            <DataTable.Title style={StyleSheet.flatten([styles.headerCell, { flex: 2 }])} onPress={() => {
              if (sortField === 'id') setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
              setSortField('id');
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text>Pedido / Cliente</Text>
                {sortField === 'id' && (
                  <IconButton icon={sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'} size={16} style={styles.sortIcon} />
                )}
              </View>
            </DataTable.Title>
            <DataTable.Title style={StyleSheet.flatten([styles.headerCell, { flex: 1.2 }])} onPress={() => {
              if (sortField === 'createdAt') setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
              setSortField('createdAt');
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text>Data</Text>
                {sortField === 'createdAt' && (
                  <IconButton icon={sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'} size={16} style={styles.sortIcon} />
                )}
              </View>
            </DataTable.Title>
            <DataTable.Title style={styles.headerCell} numeric onPress={() => {
              if (sortField === 'total') setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
              setSortField('total');
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text>Total</Text>
                {sortField === 'total' && (
                  <IconButton icon={sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'} size={16} style={styles.sortIcon} />
                )}
              </View>
            </DataTable.Title>
            <DataTable.Title style={StyleSheet.flatten([styles.headerCell, { flex: 1.5 }])} onPress={() => {
              if (sortField === 'status') setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
              setSortField('status');
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text>Status</Text>
                {sortField === 'status' && (
                  <IconButton icon={sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'} size={16} style={styles.sortIcon} />
                )}
              </View>
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
                                <OrderStatusChip status={status} />
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
      {/* Dialog de confirmação de alteração de status */}
      <ConfirmStatusDialog
        visible={!!confirmChange}
        onDismiss={() => setConfirmChange(null)}
        onConfirm={confirmStatusChange}
        updating={updatingStatus}
        order={confirmChange?.order}
        newStatus={confirmChange?.newStatus}
      />
    </>
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
  if (!visible) return null;
  return (
    <Portal>
      <View style={styles.dialogOverlay} pointerEvents={visible ? 'auto' : 'none'}>
        <Dialog
          visible={visible}
          onDismiss={onDismiss}
          style={styles.confirmDialog}
        >
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
      </View>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  dialogOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  confirmDialog: {
    width: '90%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    marginBottom: textSpacing.pageTitle,
    fontSize: typography.pageTitle,
    fontWeight: '700',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 8,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.md,
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
  subtitle: {
    opacity: 0.7,
    marginBottom: textSpacing.cardDescription,
    fontSize: typography.subtitle,
  },
  noOrdersContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noOrdersText: {
    textAlign: 'center',
  },
  sortIcon: {
    margin: 0,
    padding: 0,
  },
});

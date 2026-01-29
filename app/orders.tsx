import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Badge,
  Button,
  DataTable,
  Dialog,
  Icon,
  IconButton,
  Portal,
  Text,
  TextInput,
  Title,
  useTheme,
} from 'react-native-paper';
import DateRangePicker from '../components/DateRangePicker';
import OrderStatusChip from '../components/OrderStatusChip';
import { useChatNotifications } from '../contexts/ChatNotificationsContext';
import {
  type HistoryDatePreset,
  type OrdersSortField,
  useOrdersFilters
} from '../contexts/OrdersFiltersContext';
import * as OrdersService from '../services/orders';
import { spacing, textSpacing, typography } from '../styles/theme';
import type { Order } from '../types';
import { getOrderStatusStyle, ORDER_STATUSES } from '../types/orderStatus';
import './global.css';

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

function darkenColor(input: string, amount: number): string {
  // amount: 0.10 => 10% mais escuro
  if (!input || typeof input !== 'string') return input;
  const amt = Math.min(1, Math.max(0, amount));

  const hex = input.trim();
  const hexMatch = /^#([0-9a-fA-F]{6})([0-9a-fA-F]{2})?$/.exec(hex);
  if (hexMatch) {
    const rgbHex = hexMatch[1];
    const alphaHex = hexMatch[2];

    const r = parseInt(rgbHex.slice(0, 2), 16);
    const g = parseInt(rgbHex.slice(2, 4), 16);
    const b = parseInt(rgbHex.slice(4, 6), 16);

    const scale = 1 - amt;
    const rr = Math.round(r * scale);
    const gg = Math.round(g * scale);
    const bb = Math.round(b * scale);

    const out = `#${rr.toString(16).padStart(2, '0')}${gg.toString(16).padStart(2, '0')}${bb
      .toString(16)
      .padStart(2, '0')}`;
    return alphaHex ? `${out}${alphaHex.toLowerCase()}` : out;
  }

  const rgbaMatch = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+)\s*)?\)$/.exec(
    input.trim()
  );
  if (rgbaMatch) {
    const r = Number(rgbaMatch[1]);
    const g = Number(rgbaMatch[2]);
    const b = Number(rgbaMatch[3]);
    const a = rgbaMatch[4] != null ? Number(rgbaMatch[4]) : null;
    const scale = 1 - amt;
    const rr = Math.round(r * scale);
    const gg = Math.round(g * scale);
    const bb = Math.round(b * scale);
    return a == null ? `rgb(${rr}, ${gg}, ${bb})` : `rgba(${rr}, ${gg}, ${bb}, ${a})`;
  }

  return input;
}

// Componente auxiliar para ícone de chat com badge
function ChatIconWithBadge({ orderId, merchantId, customerName }: { orderId: string; merchantId?: string; customerName?: string }) {
  const { unreadByOrder } = useChatNotifications();
  const unreadCount = unreadByOrder.get(orderId) || 0;
  const router = useRouter();

  const handlePress = (e: any) => {
    e.stopPropagation(); // Impede que o clique propague para o Pressable pai
    router.push({
      pathname: '/chat/[orderId]',
      params: {
        orderId,
        merchantId,
        returnTo: 'orders',
        customerName,
      },
    });
  };

  return (
    <Pressable onPress={handlePress} style={{ position: 'relative' }}>
      <IconButton icon="chat-outline" size={20} />
      {unreadCount > 0 && (
        <Badge
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            backgroundColor: '#f44336',
            minWidth: 16,
            height: 16,
          }}
          size={12}
        >
          {unreadCount}
        </Badge>
      )}
    </Pressable>
  );
}

export default function OrdersScreen() {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState<Record<string, boolean>>({});
  const [confirmChange, setConfirmChange] = useState<{ order: Order; newStatus: Order['status'] } | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const {
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
  } = useOrdersFilters();

  // Tipagem local (mantém o arquivo explícito)
  type SortField = OrdersSortField;
  const router = useRouter();
  const theme = useTheme();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = OrdersService.subscribeOrders(
      (newOrders) => {
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

  const getOrderCreatedAtDate = (o: Order) => {
    const val: any = o.createdAt;
    if (!val) return null;
    if (typeof val.toDate === 'function') return val.toDate() as Date;
    if (val instanceof Date) return val;
    if (typeof val === 'string' || typeof val === 'number') return new Date(val);
    return null;
  };

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const sortOrders = (base: Order[]) => {
    return [...base].sort((a, b) => {
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

  };

  const todaysOrders = useMemo(() => {
    const now = new Date();
    return allOrders.filter((o) => {
      const d = getOrderCreatedAtDate(o);
      if (!d) return false;
      return isSameDay(d, now);
    });
  }, [allOrders]);

  const ordersByStatus = useMemo(() => {
    const counts = ORDER_STATUSES.reduce((acc, status) => {
      acc[status] = 0;
      return acc;
    }, {} as Record<Order['status'], number>);

    for (const o of todaysOrders) {
      if (typeof counts[o.status] === 'number') counts[o.status] += 1;
    }
    return counts;
  }, [todaysOrders]);

  const historyBaseOrders = useMemo(() => {
    const now = new Date();
    return allOrders.filter((o) => {
      const d = getOrderCreatedAtDate(o);
      if (!d) return false;
      return !isSameDay(d, now);
    });
  }, [allOrders]);

  const todaysFilteredOrders = useMemo(() => {
    let base = todaysOrders;
    if (todayStatuses.length > 0) {
      base = base.filter((o) => todayStatuses.includes(o.status));
    }

    // Busca por ID ou nome do cliente (case-insensitive)
    if (todaySearchQuery.trim().length > 0) {
      const q = todaySearchQuery.trim().toLowerCase();
      base = base.filter((o) => {
        const name = (o.customerName || '').toLowerCase();
        return name.includes(q) || o.id.toLowerCase().includes(q);
      });
    }

    return sortOrders(base);
  }, [todaysOrders, todayStatuses, todaySearchQuery, sortField, sortDirection]);

  const historyFilteredOrders = useMemo(() => {
    let base = historyBaseOrders;

    // Filtro por status (chips)
    if (historyStatuses.length > 0) {
      base = base.filter((o) => historyStatuses.includes(o.status));
    }

    // Busca por ID ou nome do cliente (case-insensitive)
    if (historySearchQuery.trim().length > 0) {
      const q = historySearchQuery.trim().toLowerCase();
      base = base.filter((o) => {
        const name = (o.customerName || '').toLowerCase();
        const hasProductId =
          Array.isArray(o.items) &&
          o.items.some((it: any) => String(it?.productId || '').toLowerCase().includes(q));
        return name.includes(q) || o.id.toLowerCase().includes(q) || hasProductId;
      });
    }

    // Filtro de data por presets (sem "Hoje" aqui, pois há um card dedicado)
    const now = new Date();
    if (historyDatePreset !== 'all') {
      base = base.filter((o) => {
        const d = getOrderCreatedAtDate(o);
        if (!d) return false;

        if (historyDatePreset === 'last7') {
          const diffMs = now.getTime() - d.getTime();
          const diffDays = diffMs / (1000 * 60 * 60 * 24);
          return diffDays <= 7;
        }
        if (historyDatePreset === 'month') {
          return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
        }
        if (historyDatePreset === 'custom') {
          const start = historyCustomRange.start;
          const end = historyCustomRange.end;

          if (!start && !end) return true;

          const startBound = start ? new Date(start) : null;
          if (startBound) startBound.setHours(0, 0, 0, 0);

          const endBound = end ? new Date(end) : null;
          if (endBound) endBound.setHours(23, 59, 59, 999);

          if (startBound && d < startBound) return false;
          if (endBound && d > endBound) return false;
          return true;
        }
        return true;
      });
    }

    return sortOrders(base);
  }, [historyBaseOrders, historyStatuses, historySearchQuery, historyDatePreset, historyCustomRange, sortField, sortDirection]);

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
    router.push({
      pathname: '/orders/[orderId]',
      params: { orderId: order.id, merchantId: order.merchantId, returnTo: 'orders' },
    });
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

        {/* Card: Pedidos por Status (Hoje) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pedidos por Status</Text>
          <Text style={styles.cardDescription}>Contagem de pedidos de hoje por etapa.</Text>
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
                  <MaterialCommunityIcons name={c.icon as any} size={22} color={c.fg} />
                  <Text style={StyleSheet.flatten([styles.statusSummaryName, { color: c.fg }])}>
                    {status}
                  </Text>
                  <Text style={StyleSheet.flatten([styles.statusSummaryCount, { color: c.fg }])}>
                    {count}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Card: Hoje */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Hoje</Text>
          <Text style={styles.cardDescription}>Pedidos recebidos hoje (apenas filtro por status).</Text>

          <View style={styles.chipsContainer}>
            {ORDER_STATUSES.map((status) => (
              <OrderStatusChip
                key={`today-${status}`}
                status={status}
                selected={todayStatuses.includes(status)}
                onPress={() => {
                  setTodayStatuses((prev) =>
                    prev.includes(status)
                      ? prev.filter((s) => s !== status)
                      : [...prev, status]
                  );
                }}
                style={{ marginRight: spacing.xs, marginBottom: spacing.xs }}
              />
            ))}
            {todayStatuses.length > 0 && (
              <Button mode="text" onPress={() => setTodayStatuses([])} style={{ marginLeft: 8 }} compact>
                Limpar filtros
              </Button>
            )}
          </View>

          <View style={styles.toolbar}>
            <View style={{ flex: 1 }}>
              <TextInput
                mode="outlined"
                placeholder="Buscar por ID ou Cliente"
                value={todaySearchQuery}
                onChangeText={(txt) => setTodaySearchQuery(txt)}
              />
            </View>
          </View>

          <DataTable>
            <DataTable.Header style={StyleSheet.flatten([styles.header, styles.dataTableHeader])}>
              <DataTable.Title style={StyleSheet.flatten([styles.headerCell, styles.titleLeft, { flex: 2 }])} onPress={() => {
                if (sortField === 'id') setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                setSortField('id');
              }}>
                <View style={styles.headerCellLeft}>
                  <Text style={styles.headerLabelLeft}>Pedido / Cliente</Text>
                  {sortField === 'id' && (
                    <View style={styles.sortIconContainer}>
                      <Icon
                        source={sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'}
                        size={16}
                        color={theme.colors.onSurfaceVariant}
                      />
                    </View>
                  )}
                </View>
              </DataTable.Title>
              <DataTable.Title style={StyleSheet.flatten([styles.headerCell, styles.titleCenter, { flex: 1.2 }])} onPress={() => {
                if (sortField === 'createdAt') setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                setSortField('createdAt');
              }}>
                <View style={styles.headerCellCenter}>
                  <Text style={styles.headerLabelCenter}>Data</Text>
                  {sortField === 'createdAt' && (
                    <View style={styles.sortIconContainer}>
                      <Icon
                        source={sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'}
                        size={16}
                        color={theme.colors.onSurfaceVariant}
                      />
                    </View>
                  )}
                </View>
              </DataTable.Title>
              <DataTable.Title style={StyleSheet.flatten([styles.headerCell, styles.titleCenter])} onPress={() => {
                if (sortField === 'total') setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                setSortField('total');
              }}>
                <View style={styles.headerCellCenter}>
                  <Text style={styles.headerLabelCenter}>Total</Text>
                  {sortField === 'total' && (
                    <View style={styles.sortIconContainer}>
                      <Icon
                        source={sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'}
                        size={16}
                        color={theme.colors.onSurfaceVariant}
                      />
                    </View>
                  )}
                </View>
              </DataTable.Title>
              <DataTable.Title style={StyleSheet.flatten([styles.headerCell, styles.titleCenter, { flex: 1.5 }])} onPress={() => {
                if (sortField === 'status') setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                setSortField('status');
              }}>
                <View style={styles.headerCellCenter}>
                  <Text style={styles.headerLabelCenter}>Status</Text>
                  {sortField === 'status' && (
                    <View style={styles.sortIconContainer}>
                      <Icon
                        source={sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'}
                        size={16}
                        color={theme.colors.onSurfaceVariant}
                      />
                    </View>
                  )}
                </View>
              </DataTable.Title>
              <DataTable.Title style={StyleSheet.flatten([styles.headerCell, styles.titleCenter])}>
                <View style={styles.headerCellCenter}>
                  <Text style={styles.headerLabelCenter}>Ações</Text>
                </View>
              </DataTable.Title>
            </DataTable.Header>

            {todaysFilteredOrders.map((order) => (
              <Pressable key={order.id} onPress={() => handleRowPress(order)}>
                {({ hovered }) => (
                  <DataTable.Row
                    style={StyleSheet.flatten([
                      styles.row,
                      hovered && { backgroundColor: theme.colors.surfaceVariant },
                    ])}>
                    <DataTable.Cell style={StyleSheet.flatten([styles.cellLeft, { flex: 2 }])}>
                      <View style={styles.cellInnerLeft}>
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
                    <DataTable.Cell style={StyleSheet.flatten([styles.cellCenter, { flex: 1.2 }])}>
                      <Text style={styles.cellTextCenter}>{formatDate(order.createdAt)}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell style={styles.cellCenter}>
                      <Text style={styles.cellTextCenter}>{formatBRLFromCentavos(order.total)}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell style={StyleSheet.flatten([styles.cellCenter, { flex: 1.5 }])}>
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
                    <DataTable.Cell style={styles.cellCenter}>
                      <View style={styles.actionsCell}>
                        <ChatIconWithBadge
                          orderId={order.id}
                          merchantId={order.merchantId}
                          customerName={order.customerName}
                        />
                        <IconButton icon="chevron-right" size={20} />
                      </View>
                    </DataTable.Cell>
                  </DataTable.Row>
                )}
              </Pressable>
            ))}

            {todaysFilteredOrders.length === 0 && !loading && (
              <View style={styles.noOrdersContainer}>
                <Text style={styles.noOrdersText}>
                  Nenhum pedido de hoje encontrado para este filtro.
                </Text>
              </View>
            )}
          </DataTable>
        </View>

        {/* Card: Histórico */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Histórico</Text>
          <Text style={styles.cardDescription}>Pedidos anteriores (filtros por status e data).</Text>

          {/* Chips de filtro de status */}
          <View style={styles.chipsContainer}>
            {ORDER_STATUSES.map((status) => (
              <OrderStatusChip
                key={`history-${status}`}
                status={status}
                selected={historyStatuses.includes(status)}
                onPress={() => {
                  setHistoryStatuses((prev) =>
                    prev.includes(status)
                      ? prev.filter((s) => s !== status)
                      : [...prev, status]
                  );
                }}
                style={{ marginRight: spacing.xs, marginBottom: spacing.xs }}
              />
            ))}
            {historyStatuses.length > 0 && (
              <Button mode="text" onPress={() => setHistoryStatuses([])} style={{ marginLeft: 8 }} compact>
                Limpar filtros
              </Button>
            )}
          </View>

          {/* Toolbar com busca e filtro de data */}
          <View style={StyleSheet.flatten([styles.toolbar, { flexDirection: 'column', alignItems: 'stretch' }])}>
            <View style={{ width: '100%' }}>
              <TextInput
                mode="outlined"
                placeholder="Buscar por Cliente ou ID do Produto"
                value={historySearchQuery}
                onChangeText={(txt) => setHistorySearchQuery(txt)}
              />
            </View>

            <View style={StyleSheet.flatten([styles.datePresetContainer, { width: '100%', flexWrap: 'wrap' }])}>
              {[
                { key: 'all', label: 'Todos' },
                { key: 'last7', label: 'Últimos 7 dias' },
                { key: 'month', label: 'Este mês' },
                { key: 'custom', label: 'Período personalizado' },
              ].map((p) => (
                (() => {
                  const isActive = historyDatePreset === p.key;
                  const inactiveBg =
                    (theme.colors as any)?.elevation?.level1 ??
                    (theme.colors as any)?.surfaceVariant ??
                    theme.colors.surface;
                  const activeBgBase =
                    (theme.colors as any)?.elevation?.level3 ??
                    (theme.colors as any)?.surfaceVariant ??
                    theme.colors.surface;
                  const activeBg = darkenColor(activeBgBase, 0.1);
                  const inactiveBorder = (theme.colors as any)?.outlineVariant ?? theme.colors.outline;

                  return (
                    <Pressable
                      key={p.key}
                      onPress={() => {
                        const next = p.key as HistoryDatePreset;
                        setHistoryDatePreset(next);
                        if (next === 'custom' && !historyCustomRange.start && !historyCustomRange.end) {
                          const today = new Date();
                          setHistoryCustomRange({ start: today, end: today });
                        }
                      }}
                      style={StyleSheet.flatten([
                        styles.presetChip,
                        {
                          backgroundColor: isActive ? activeBg : inactiveBg,
                          borderColor: isActive ? theme.colors.outline : inactiveBorder,
                          borderWidth: isActive ? 2 : 1,
                        },
                        isActive && styles.presetChipActive,
                      ])}
                    >
                      <Text style={StyleSheet.flatten([
                        styles.presetLabel,
                        {
                          color: isActive
                            ? theme.colors.onSurface
                            : ((theme.colors as any)?.onSurfaceVariant ?? theme.colors.onSurface),
                        },
                        isActive && styles.presetLabelActive,
                      ])}>{p.label}</Text>
                    </Pressable>
                  );
                })()
              ))}
            </View>

            {historyDatePreset === 'custom' && (
              <DateRangePicker
                start={historyCustomRange.start}
                end={historyCustomRange.end}
                onChange={setHistoryCustomRange}
              />
            )}
          </View>

          <DataTable>
            <DataTable.Header style={StyleSheet.flatten([styles.header, styles.dataTableHeader])}>
              <DataTable.Title style={StyleSheet.flatten([styles.headerCell, styles.titleLeft, { flex: 2 }])} onPress={() => {
                if (sortField === 'id') setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                setSortField('id');
              }}>
                <View style={styles.headerCellLeft}>
                  <Text style={styles.headerLabelLeft}>Pedido / Cliente</Text>
                  {sortField === 'id' && (
                    <View style={styles.sortIconContainer}>
                      <Icon
                        source={sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'}
                        size={16}
                        color={theme.colors.onSurfaceVariant}
                      />
                    </View>
                  )}
                </View>
              </DataTable.Title>
              <DataTable.Title style={StyleSheet.flatten([styles.headerCell, styles.titleCenter, { flex: 1.2 }])} onPress={() => {
                if (sortField === 'createdAt') setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                setSortField('createdAt');
              }}>
                <View style={styles.headerCellCenter}>
                  <Text style={styles.headerLabelCenter}>Data</Text>
                  {sortField === 'createdAt' && (
                    <View style={styles.sortIconContainer}>
                      <Icon
                        source={sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'}
                        size={16}
                        color={theme.colors.onSurfaceVariant}
                      />
                    </View>
                  )}
                </View>
              </DataTable.Title>
              <DataTable.Title style={StyleSheet.flatten([styles.headerCell, styles.titleCenter])} onPress={() => {
                if (sortField === 'total') setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                setSortField('total');
              }}>
                <View style={styles.headerCellCenter}>
                  <Text style={styles.headerLabelCenter}>Total</Text>
                  {sortField === 'total' && (
                    <View style={styles.sortIconContainer}>
                      <Icon
                        source={sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'}
                        size={16}
                        color={theme.colors.onSurfaceVariant}
                      />
                    </View>
                  )}
                </View>
              </DataTable.Title>
              <DataTable.Title style={StyleSheet.flatten([styles.headerCell, styles.titleCenter, { flex: 1.5 }])} onPress={() => {
                if (sortField === 'status') setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                setSortField('status');
              }}>
                <View style={styles.headerCellCenter}>
                  <Text style={styles.headerLabelCenter}>Status</Text>
                  {sortField === 'status' && (
                    <View style={styles.sortIconContainer}>
                      <Icon
                        source={sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'}
                        size={16}
                        color={theme.colors.onSurfaceVariant}
                      />
                    </View>
                  )}
                </View>
              </DataTable.Title>
              <DataTable.Title style={StyleSheet.flatten([styles.headerCell, styles.titleCenter])}>
                <View style={styles.headerCellCenter}>
                  <Text style={styles.headerLabelCenter}>Ações</Text>
                </View>
              </DataTable.Title>
            </DataTable.Header>

            {historyFilteredOrders.map((order) => (
              <Pressable key={order.id} onPress={() => handleRowPress(order)}>
                {({ hovered }) => (
                  <DataTable.Row
                    style={StyleSheet.flatten([
                      styles.row,
                      hovered && { backgroundColor: theme.colors.surfaceVariant },
                    ])}>
                    <DataTable.Cell style={StyleSheet.flatten([styles.cellLeft, { flex: 2 }])}>
                      <View style={styles.cellInnerLeft}>
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
                    <DataTable.Cell style={StyleSheet.flatten([styles.cellCenter, { flex: 1.2 }])}>
                      <Text style={styles.cellTextCenter}>{formatDate(order.createdAt)}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell style={styles.cellCenter}>
                      <Text style={styles.cellTextCenter}>{formatBRLFromCentavos(order.total)}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell style={StyleSheet.flatten([styles.cellCenter, { flex: 1.5 }])}>
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
                    <DataTable.Cell style={styles.cellCenter}>
                      <View style={styles.actionsCell}>
                        <ChatIconWithBadge
                          orderId={order.id}
                          merchantId={order.merchantId}
                          customerName={order.customerName}
                        />
                        <IconButton icon="chevron-right" size={20} />
                      </View>
                    </DataTable.Cell>
                  </DataTable.Row>
                )}
              </Pressable>
            ))}

            {historyFilteredOrders.length === 0 && !loading && (
              <View style={styles.noOrdersContainer}>
                <Text style={styles.noOrdersText}>
                  Nenhum pedido encontrado para este filtro.
                </Text>
              </View>
            )}
          </DataTable>

        </View>
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cardTitle: {
    fontSize: typography.cardTitle,
    fontWeight: '700',
    marginBottom: 2,
  },
  cardDescription: {
    opacity: 0.7,
    marginBottom: textSpacing.cardDescription,
    fontSize: typography.subtitle,
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
    borderWidth: 1,
    borderColor: 'transparent',
  },
  presetChipActive: {
    // Mantido para ajustes finos via StyleSheet (o contraste vem do theme no render)
  },
  presetLabel: {
    fontWeight: '600',
  },
  presetLabelActive: {
    fontWeight: '700',
  },
  header: {
    backgroundColor: '#f7f7f7',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerCell: {
    paddingHorizontal: 8,
  },
  dataTableHeader: {
    alignItems: 'center',
    paddingVertical: 6,
    minHeight: 48,
  },
  titleLeft: {
    justifyContent: 'flex-start',
  },
  titleCenter: {
    justifyContent: 'center',
  },
  headerCellLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flex: 1,
    width: '100%',
  },
  headerCellCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    width: '100%',
  },
  headerLabelLeft: {
    textAlign: 'left',
  },
  headerLabelCenter: {
    textAlign: 'center',
  },
  row: {
    minHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cellLeft: {
    justifyContent: 'flex-start',
  },
  cellCenter: {
    justifyContent: 'center',
  },
  cellInnerLeft: {
    width: '100%',
    alignItems: 'flex-start',
  },
  cellTextCenter: {
    width: '100%',
    textAlign: 'center',
  },
  actionsCell: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  sortIconContainer: {
    marginLeft: 4,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusSummaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statusSummaryItem: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    flexGrow: 1,
    flexBasis: 140,
    minWidth: 140,
    minHeight: 140,
    justifyContent: 'space-between',
  },
  statusSummaryName: {
    fontWeight: '600',
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: 16,
    fontSize: 13,
    maxWidth: 140,
    minHeight: 34,
  },
  statusSummaryCount: {
    fontWeight: '800',
    fontSize: typography.heading2,
    marginTop: 2,
  },
});

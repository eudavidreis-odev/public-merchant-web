import { Link, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  DataTable,
  IconButton,
  Menu,
  SegmentedButtons,
  Text,
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
  const [filter, setFilter] = useState('active');
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

  const filteredOrders = useMemo(() => {
    if (filter === 'active') {
      return allOrders.filter((order) => ACTIVE_STATUSES.includes(order.status));
    }
    return allOrders.filter((order) => !ACTIVE_STATUSES.includes(order.status));
  }, [allOrders, filter]);

  const openMenu = (orderId: string) =>
    setMenuVisible((prev) => ({ ...prev, [orderId]: true }));

  const closeMenu = (orderId: string) =>
    setMenuVisible((prev) => ({ ...prev, [orderId]: false }));

  const handleStatusChange = async (
    order: Order,
    newStatus: Order['status']
  ) => {
    closeMenu(order.id);
    try {
      if (!order.merchantId) {
        throw new Error('Merchant ID não encontrado para este pedido.');
      }
      await OrdersService.updateOrderStatus(
        order.merchantId,
        order.id,
        newStatus
      );
      // Opcional: feedback de sucesso
    } catch (error) {
      console.error('Erro ao atualizar status do pedido:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
      Alert.alert('Erro', `Falha ao atualizar status: ${errorMessage}`);
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

      <SegmentedButtons
        value={filter}
        onValueChange={setFilter}
        style={styles.segment}
        buttons={[
          { value: 'active', label: 'Em Andamento' },
          { value: 'history', label: 'Histórico' },
        ]}
      />

      <DataTable>
        <DataTable.Header style={styles.header}>
          <DataTable.Title style={[styles.headerCell, { flex: 2 }]}>
            <Text>Pedido / Cliente</Text>
          </DataTable.Title>
          <DataTable.Title style={[styles.headerCell, { flex: 1.2 }]}>
            <Text>Data</Text>
          </DataTable.Title>
          <DataTable.Title style={styles.headerCell} numeric>
            <Text>Total</Text>
          </DataTable.Title>
          <DataTable.Title style={[styles.headerCell, { flex: 1.5 }]}>
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
                style={[
                  styles.row,
                  hovered && { backgroundColor: theme.colors.surfaceVariant },
                ]}>
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
                  <Menu
                    visible={!!menuVisible[order.id]}
                    onDismiss={() => closeMenu(order.id)}
                    anchor={
                      <OrderStatusChip
                        status={order.status}
                        onPress={() => openMenu(order.id)}
                      />
                    }>
                    {ORDER_STATUSES.map((status) => (
                      <Menu.Item
                        key={status}
                        onPress={() => handleStatusChange(order, status)}
                        title={status}
                      />
                    ))}
                  </Menu>
                </DataTable.Cell>
                <DataTable.Cell numeric>
                  <Link
                    href={{
                      pathname: `/chat/${order.id}`,
                      params: { merchantId: order.merchantId },
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    marginBottom: 16,
    fontSize: 24,
    fontWeight: 'bold',
  },
  segment: {
    marginBottom: 16,
  },
  header: {
    backgroundColor: '#f7f7f7',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerCell: {
    paddingHorizontal: 4, // Reduzido
  },
  row: {
    minHeight: 56, // Densidade ajustada
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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


import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, Button, DataTable } from 'react-native-paper';
import { Order } from '../types';

const mockOrders: Order[] = [
  { id: '123', status: 'Preparando', total_centavos: 3550, items: [{ name: 'X-Burger', quantity: 1 }] },
  { id: '122', status: 'Criado', total_centavos: 2500, items: [{ name: 'Suco de Laranja', quantity: 2 }] },
  { id: '121', status: 'Entregue', total_centavos: 5000, items: [{ name: 'Pizza M', quantity: 1 }] },
  { id: '120', status: 'Cancelado', total_centavos: 1500, items: [{ name: 'Refrigerante', quantity: 1 }] },
];

export default function OrdersScreen() {
  return (
    <View style={styles.container}>
      <Text variant="displayMedium" style={styles.title}>Pedidos</Text>
      <DataTable>
        <DataTable.Header>
          <DataTable.Title>Pedido ID</DataTable.Title>
          <DataTable.Title>Status</DataTable.Title>
          <DataTable.Title numeric>Total</DataTable.Title>
          <DataTable.Title>Ações</DataTable.Title>
        </DataTable.Header>

        {mockOrders.map(order => (
          <DataTable.Row key={order.id}>
            <DataTable.Cell>#{order.id}</DataTable.Cell>
            <DataTable.Cell>{order.status}</DataTable.Cell>
            <DataTable.Cell numeric>R$ {(order.total_centavos / 100).toFixed(2)}</DataTable.Cell>
            <DataTable.Cell>
                <Button mode="text" onPress={() => alert('Abrindo chat...')}>Chat</Button>
                <Button mode="text" onPress={() => alert('Mudando status...')}>Status</Button>
            </DataTable.Cell>
          </DataTable.Row>
        ))}
      </DataTable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 24,
  },
});

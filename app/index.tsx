
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';

// Mock components for now
const EarningsCard = () => (
    <View style={styles.card}>
        <Text variant="headlineMedium">Ganhos</Text>
        <Text variant="titleLarge">R$ 1.250,50</Text>
        <Text>Clique para ver detalhes</Text>
    </View>
);

const RecentOrdersCard = () => (
    <View style={styles.card}>
        <Text variant="headlineMedium">Últimos Pedidos</Text>
        <Text>Pedido #123 - Preparando</Text>
        <Text>Pedido #122 - Criado</Text>
        <Text>Pedido #121 - Criado</Text>
        <Text>Clique para ver todos</Text>
    </View>
);


export default function DashboardScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text variant="displayMedium" style={styles.title}>Dashboard</Text>
      <View style={styles.cardsContainer}>
        <EarningsCard />
        <RecentOrdersCard />
      </View>
    </ScrollView>
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
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  card: {
      minWidth: 300,
      padding: 16,
      borderWidth: 1,
      borderColor: '#e0e0e0',
      borderRadius: 8,
      backgroundColor: '#f9f9f9',
      gap: 8,
  }
});

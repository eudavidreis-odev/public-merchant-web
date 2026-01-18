import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import CategoryRanking from '../components/charts/CategoryRanking';
import MenuMatrix from '../components/charts/MenuMatrix';
import RevenueChart from '../components/charts/RevenueChart';
import { useFinanceMetrics } from '../services/finance';

export default function FinanceScreen() {
  const { revenueMonthly, categoryRanking, menuMatrix } = useFinanceMetrics();
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="displayMedium">Análise Financeira</Text>
        <Text variant="headlineSmall">Período: Últimos 30 dias</Text>
      </View>

      {/* Receita nos últimos 30 dias */}
      <RevenueChart data={revenueMonthly} />

      {/* Ranking de categorias */}
      <CategoryRanking data={categoryRanking} />

      {/* Engenharia de cardápio */}
      <MenuMatrix items={menuMatrix} />

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f4f4f4' // A slightly different background for the screen
  },
  header: {
    marginBottom: 24,
  },
});
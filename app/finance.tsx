import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import RevenueChart from '../components/charts/RevenueChart';
import CategoryRanking from '../components/charts/CategoryRanking';
import MenuMatrix from '../components/charts/MenuMatrix';

export default function FinanceScreen() {
  return (
    <ScrollView style={styles.container}>
        <View style={styles.header}>
            <Text variant="displayMedium">Análise Financeira</Text>
            <Text variant="headlineSmall">Período: Últimos 30 dias</Text>
        </View>

        {/* Revenue Chart - Monthly view */}
        <RevenueChart period="monthly" />

        {/* Category Ranking */}
        <CategoryRanking />

        {/* Menu Engineering Matrix */}
        <MenuMatrix />

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
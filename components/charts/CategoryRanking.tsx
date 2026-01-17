
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

// Mock data similar to what useFinanceMetrics would provide
const mockCategoryData = [
  { value: 4500, label: 'Lanches', frontColor: '#007BFF' },
  { value: 3200, label: 'Bebidas', frontColor: '#4CAF50' },
  { value: 1500, label: 'Sobremesas', frontColor: '#FFC107' },
  { value: 800, label: 'Combos', frontColor: '#F44336' },
].sort((a, b) => b.value - a.value); // Sort descending


export default function CategoryRanking() {
  const totalValue = mockCategoryData.reduce((sum, item) => sum + item.value, 0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ranking de Categorias (Faturamento)</Text>
      <View style={styles.chartContainer}>
        <BarChart
          horizontal
          isAnimated
          barWidth={30}
          data={mockCategoryData}
          yAxisAtTop
          xAxisLabelTextStyle={styles.xAxisLabel}
          noOfSections={4}
          barBorderRadius={4}
          hideRules
          hideYAxisText
          xAxisThickness={0}
          yAxisThickness={0}
          renderTooltip={(item: { value: number; label: string; frontColor?: string }) => (
            <View style={styles.tooltip}>
              <Text style={{ color: 'white' }}>R$ {item.value.toFixed(2)}</Text>
            </View>
          )}
        // Custom rendering to show label on the left and value on the right
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  chartContainer: {
    paddingLeft: 10, // Adjust as needed
  },
  yAxisLabel: {
    textAlign: 'left',
    color: '#333',
    fontWeight: '600',
    width: 80
  },
  xAxisLabel: {
    color: 'gray',
  },
  topLabel: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 5,
  },
  tooltip: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 8,
    borderRadius: 4
  }
});


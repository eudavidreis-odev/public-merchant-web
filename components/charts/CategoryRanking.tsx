
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Text } from 'react-native-paper';
import type { CategoryPoint } from '../../services/finance';

type Props = { data: CategoryPoint[] };

export default function CategoryRanking({ data }: Props) {
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <View style={styles.container}>
      <Text variant="titleLarge" style={styles.title}>Ranking de Categorias (Faturamento)</Text>
      <View style={styles.chartContainer}>
        <BarChart
          horizontal
          isAnimated
          barWidth={30}
          data={data}
          yAxisAtTop
          xAxisLabelTextStyle={styles.xAxisLabel}
          noOfSections={4}
          barBorderRadius={4}
          hideRules
          hideYAxisText={false}
          yAxisLabelWidth={160}
          yAxisLabelTextStyle={styles.yAxisLabel}
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
    marginBottom: 24,
  },
  chartContainer: {
    paddingLeft: 12,
  },
  yAxisLabel: {
    textAlign: 'left',
    color: '#333',
    fontWeight: '600',
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


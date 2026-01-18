
import React from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Text } from 'react-native-paper';
import type { CategoryPoint } from '../../services/finance';

type Props = { data: CategoryPoint[] };

export default function CategoryRanking({ data }: Props) {
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);
  const { height: screenHeight } = useWindowDimensions();
  const barWidth = 30;
  const spacing = 12;
  const contentHeight = Math.max(180, data.length * (barWidth + spacing) + 24);
  const maxChartAreaHeight = Math.min(520, Math.max(260, Math.floor(screenHeight * 0.55)));
  const chartAreaHeight = Math.min(contentHeight, maxChartAreaHeight);

  return (
    <View style={styles.container}>
      <Text variant="titleLarge" style={styles.title}>Ranking de Categorias (Faturamento)</Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        {data.length > 0
          ? `Total no período: R$ ${totalValue.toFixed(2)} • ${data.length} categorias`
          : 'Sem dados de faturamento por categoria no período.'}
      </Text>
      <View style={[styles.chartContainer, { height: chartAreaHeight }]}>
        <ScrollView
          style={styles.chartScroll}
          contentContainerStyle={styles.chartScrollContent}
          showsVerticalScrollIndicator={true}
        >
          <BarChart
            horizontal
            isAnimated
            barWidth={barWidth}
            spacing={spacing}
            initialSpacing={8}
            endSpacing={8}
            height={contentHeight}
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
        </ScrollView>
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
    marginBottom: 6,
  },
  subtitle: {
    opacity: 0.7,
    marginBottom: 12,
  },
  chartContainer: {
    paddingLeft: 12,
    overflow: 'hidden',
  },
  chartScroll: {
    flex: 1,
  },
  chartScrollContent: {
    paddingBottom: 8,
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


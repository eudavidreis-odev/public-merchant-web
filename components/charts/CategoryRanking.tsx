
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { CARD_PADDING } from '../../constants/card';
import type { CategoryPoint } from '../../services/finance';
import { textSpacing, typography } from '../../styles/theme';

type Props = { data: CategoryPoint[] };

export default function CategoryRanking({ data }: Props) {
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);
  const maxValue = Math.max(...data.map((d) => d.value), 0);

  return (
    <Card style={styles.container}>
      <Card.Content style={styles.header}>
        <Text style={styles.title}>
          Ranking de Categorias (Faturamento)
        </Text>
        <Text style={styles.subtitle}>
          {data.length > 0
            ? `Total no período: R$ ${totalValue.toFixed(2)} • ${data.length} categorias`
            : 'Sem dados de faturamento por categoria no período.'}
        </Text>
      </Card.Content>

      <Card.Content style={styles.content}>
        <View style={styles.chartWrapper}>
          {data.length === 0 ? (
            <Text variant="bodyMedium" style={{ opacity: 0.7 }}>
              Sem categorias para exibir.
            </Text>
          ) : (
            data.map((item) => {
              const pct = maxValue > 0 ? item.value / maxValue : 0;
              const barColor = item.frontColor || '#007BFF';
              return (
                <View key={item.label} style={styles.row}>
                  <View style={styles.labelCol}>
                    <Text style={styles.labelText} numberOfLines={1}>
                      {item.label}
                    </Text>
                  </View>

                  <View style={styles.barCol}>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${Math.round(pct * 100)}%`, backgroundColor: barColor }]} />
                    </View>
                  </View>

                  <View style={styles.valueCol}>
                    <Text style={styles.valueText} numberOfLines={1}>
                      R$ {item.value.toFixed(2)}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginVertical: 8,
    overflow: 'hidden',
    position: 'relative',
    padding: CARD_PADDING,
  },
  header: {
    paddingBottom: 6,
  },
  title: {
    marginBottom: textSpacing.cardTitle,
    fontSize: typography.cardTitle,
    fontWeight: '700',
  },
  subtitle: {
    opacity: 0.7,
    fontSize: typography.cardDescription,
    marginBottom: textSpacing.cardDescription,
  },
  content: {
    paddingTop: 0,
    paddingBottom: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  chartWrapper: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  labelCol: {
    width: 180,
  },
  labelText: {
    color: '#333',
    fontWeight: '600',
  },
  barCol: {
    flex: 1,
  },
  barTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#f3f4f6',
    overflow: 'hidden',
  },
  barFill: {
    height: 10,
    borderRadius: 999,
  },
  valueCol: {
    width: 110,
    alignItems: 'flex-end',
  },
  valueText: {
    color: '#111827',
    fontWeight: '600',
  },
});


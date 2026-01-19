import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Menu, Text } from 'react-native-paper';
import CategoryRanking from '../components/charts/CategoryRanking';
import MenuMatrix from '../components/charts/MenuMatrix';
import RevenueChart from '../components/charts/RevenueChart';
import DateRangePicker from '../components/DateRangePicker';
import { CARD_PADDING } from '../constants/card';
import { CustomRange, FinancePeriod, useFinanceMetrics } from '../services/finance';
import { palette } from '../styles/theme';

export default function FinanceScreen() {
  const [period, setPeriod] = React.useState<FinancePeriod>('month');
  const [menuVisible, setMenuVisible] = React.useState(false);
  const [customRange, setCustomRange] = React.useState<CustomRange>({ start: null, end: null });

  // Hook agora recebe period/customRange
  const { revenueMonthly, categoryRanking, menuMatrix } = useFinanceMetrics(undefined, period, customRange);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="displayMedium">Análise Financeira</Text>
        <Text variant="bodyMedium" style={{ opacity: 0.7, marginTop: 4 }}>
          Veja métricas financeiras, receitas e rankings do período selecionado.
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={<Button
              mode="outlined"
              compact
              onPress={() => setMenuVisible(true)}
              style={{ borderColor: palette.info }}
              labelStyle={{ color: palette.info }}
            >
              {period === 'month' ? 'Este mês'
                : period === 'today' ? 'Hoje'
                  : period === 'week' ? 'Esta semana'
                    : period === '30d' ? 'Últimos 30 dias'
                      : period === 'custom' ? 'Período personalizado'
                        : 'Período'}
            </Button>}
          >
            <Menu.Item onPress={() => { setPeriod('month'); setMenuVisible(false); }} title="Este mês" />
            <Menu.Item onPress={() => { setPeriod('today'); setMenuVisible(false); }} title="Hoje" />
            <Menu.Item onPress={() => { setPeriod('week'); setMenuVisible(false); }} title="Esta semana" />
            <Menu.Item onPress={() => { setPeriod('30d'); setMenuVisible(false); }} title="Últimos 30 dias" />
            <Menu.Item onPress={() => { setPeriod('custom'); setMenuVisible(false); setCustomRange({ start: new Date(), end: new Date() }); }} title="Período personalizado" />
          </Menu>
        </View>
        {period === 'custom' && (
          <DateRangePicker
            start={customRange.start}
            end={customRange.end}
            onChange={setCustomRange}
          />
        )}
      </View>

      {/* Receita no período */}
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
    padding: CARD_PADDING,
    backgroundColor: '#f4f4f4' // A slightly different background for the screen
  },
  header: {
    marginBottom: 24,
  },
});
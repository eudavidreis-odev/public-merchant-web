import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Menu, Text } from 'react-native-paper';
import CategoryRanking from '../components/charts/CategoryRanking';
import MenuMatrix from '../components/charts/MenuMatrix';
import RevenueChart from '../components/charts/RevenueChart';
import DateRangePicker from '../components/DateRangePicker';
import { CARD_PADDING } from '../constants/card';
import { CustomRange, FinancePeriod, useFinanceMetrics } from '../services/finance';
import { palette, textSpacing, typography } from '../styles/theme';


export default function FinanceScreen() {
  const [period, setPeriod] = React.useState<FinancePeriod>('month');
  const [menuVisible, setMenuVisible] = React.useState(false);
  const [customRange, setCustomRange] = React.useState<CustomRange>({ start: null, end: null });

  // Chaves para persistência
  const PERIOD_KEY = 'finance_period';
  const RANGE_KEY = 'finance_custom_range';

  // Carregar do localStorage ao montar
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedPeriod = window.localStorage.getItem(PERIOD_KEY) as FinancePeriod | null;
    if (savedPeriod) setPeriod(savedPeriod);
    const savedRange = window.localStorage.getItem(RANGE_KEY);
    if (savedRange) {
      try {
        const parsed = JSON.parse(savedRange);
        setCustomRange({
          start: parsed.start ? new Date(parsed.start) : null,
          end: parsed.end ? new Date(parsed.end) : null,
        });
      } catch { }
    }
  }, []);

  // Salvar period no localStorage ao mudar
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(PERIOD_KEY, period);
  }, [period]);

  // Salvar customRange no localStorage ao mudar
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(RANGE_KEY, JSON.stringify({
      start: customRange.start ? customRange.start.toISOString() : null,
      end: customRange.end ? customRange.end.toISOString() : null,
    }));
  }, [customRange]);

  // Hook agora recebe period/customRange
  const { revenueMonthly, categoryRanking, menuMatrix } = useFinanceMetrics(undefined, period, customRange);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Análise Financeira</Text>
        <Text style={styles.subtitle}>
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
  title: {
    fontSize: typography.pageTitle,
    fontWeight: '700',
    marginBottom: textSpacing.pageTitle,
  },
  subtitle: {
    fontSize: typography.cardDescription,
    opacity: 0.8,
    marginTop: 4,
    marginBottom: textSpacing.cardDescription,
  },
});
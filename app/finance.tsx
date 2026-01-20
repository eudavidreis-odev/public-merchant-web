import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Menu, Text } from 'react-native-paper';

import CategoryRanking from '../components/charts/CategoryRanking';
import MenuMatrix, {
  MENU_ITEM_TYPE_ORDER,
  MENU_ITEM_TYPE_STYLES,
  type MenuItemType,
} from '../components/charts/MenuMatrix';
import RevenueChart from '../components/charts/RevenueChart';
import DateRangePicker from '../components/DateRangePicker';
import { CARD_PADDING } from '../constants/card';
import {
  type CustomRange,
  type FinancePeriod,
  useFinanceMetrics,
} from '../services/finance';
import { palette, spacing, textSpacing, typography } from '../styles/theme';

export default function FinanceScreen() {
  const [period, setPeriod] = React.useState<FinancePeriod>('month');
  const [menuVisible, setMenuVisible] = React.useState(false);
  const [customRange, setCustomRange] = React.useState<CustomRange>({ start: null, end: null });
  const [selectedMenuTypes, setSelectedMenuTypes] = React.useState<string[]>([]);

  const PERIOD_KEY = 'finance_period';
  const RANGE_KEY = 'finance_custom_range';

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
      } catch {
        // ignore
      }
    }
  }, []);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(PERIOD_KEY, period);
  }, [period]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      RANGE_KEY,
      JSON.stringify({
        start: customRange.start ? customRange.start.toISOString() : null,
        end: customRange.end ? customRange.end.toISOString() : null,
      })
    );
  }, [customRange]);

  const { revenueMonthly, categoryRanking, menuMatrix } = useFinanceMetrics(
    undefined,
    period,
    customRange
  );

  const menuTypesToShow = React.useMemo(() => {
    const present = new Set(menuMatrix.map((i) => i.type));
    const ordered = MENU_ITEM_TYPE_ORDER.filter((t) => present.has(t));
    const extras = Array.from(present).filter(
      (t) => !MENU_ITEM_TYPE_ORDER.includes(t as MenuItemType)
    );
    return [...ordered, ...extras];
  }, [menuMatrix]);

  const filteredMenuMatrix = React.useMemo(() => {
    if (selectedMenuTypes.length === 0) return menuMatrix;
    return menuMatrix.filter((i) => selectedMenuTypes.includes(i.type));
  }, [menuMatrix, selectedMenuTypes]);

  const toggleMenuType = (type: string) => {
    setSelectedMenuTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Análise Financeira</Text>
        <Text style={styles.subtitle}>
          Veja métricas financeiras, receitas e rankings do período selecionado.
        </Text>

        <View style={styles.periodRow}>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                compact
                onPress={() => setMenuVisible(true)}
                style={[styles.periodButton, { borderColor: palette.selectorText }]}
                labelStyle={[styles.periodButtonLabel, { color: palette.selectorText }]}
              >
                {period === 'month'
                  ? 'Este mês'
                  : period === 'today'
                    ? 'Hoje'
                    : period === 'week'
                      ? 'Esta semana'
                      : period === '30d'
                        ? 'Últimos 30 dias'
                        : period === 'custom'
                          ? 'Período personalizado'
                          : 'Período'}
              </Button>
            }
          >
            <Menu.Item onPress={() => { setPeriod('month'); setMenuVisible(false); }} title="Este mês" />
            <Menu.Item onPress={() => { setPeriod('today'); setMenuVisible(false); }} title="Hoje" />
            <Menu.Item onPress={() => { setPeriod('week'); setMenuVisible(false); }} title="Esta semana" />
            <Menu.Item onPress={() => { setPeriod('30d'); setMenuVisible(false); }} title="Últimos 30 dias" />
            <Menu.Item
              onPress={() => {
                setPeriod('custom');
                setMenuVisible(false);
                setCustomRange({ start: new Date(), end: new Date() });
              }}
              title="Período personalizado"
            />
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

      <RevenueChart data={revenueMonthly} />
      <CategoryRanking data={categoryRanking} />

      <MenuMatrix
        items={filteredMenuMatrix}
        filters={
          menuMatrix.length > 0 ? (
            <View style={styles.menuMatrixFilters}>
              {menuTypesToShow.map((type) => {
                const color =
                  (MENU_ITEM_TYPE_STYLES as Record<string, { color: string }>)[type]?.color ??
                  palette.gray700;
                const selected = selectedMenuTypes.includes(type);
                const bg = selected ? color : `${color}1A`;

                return (
                  <Pressable
                    key={type}
                    onPress={() => toggleMenuType(type)}
                    style={StyleSheet.flatten([
                      styles.menuTypeChip,
                      {
                        borderColor: color,
                        backgroundColor: bg,
                        borderWidth: selected ? 2 : 1,
                      },
                    ])}
                  >
                    <Text
                      style={StyleSheet.flatten([
                        styles.menuTypeChipLabel,
                        { color: selected ? palette.white : color },
                      ])}
                    >
                      {type}
                    </Text>
                  </Pressable>
                );
              })}

              {selectedMenuTypes.length > 0 && (
                <Pressable
                  onPress={() => setSelectedMenuTypes([])}
                  style={StyleSheet.flatten([
                    styles.menuTypeChip,
                    {
                      borderColor: palette.gray400,
                      backgroundColor: palette.gray100,
                    },
                  ])}
                >
                  <Text
                    style={StyleSheet.flatten([
                      styles.menuTypeChipLabel,
                      { color: palette.selectorText },
                    ])}
                  >
                    Limpar filtros
                  </Text>
                </Pressable>
              )}
            </View>
          ) : null
        }
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: CARD_PADDING,
    backgroundColor: '#f4f4f4',
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.pageTitle,
    fontWeight: '700',
    marginBottom: textSpacing.pageTitle,
  },
  subtitle: {
    fontSize: typography.cardDescription,
    opacity: 0.8,
    marginTop: spacing.xs,
    marginBottom: textSpacing.cardDescription,
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  periodButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  periodButtonLabel: {
    color: palette.selectorText,
  },
  menuMatrixFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    alignItems: 'center',
  },
  menuTypeChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
  },
  menuTypeChipLabel: {
    fontWeight: '700',
    fontSize: typography.subtitle,
  },
});
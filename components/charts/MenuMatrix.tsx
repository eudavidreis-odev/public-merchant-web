import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Avatar, Card, Chip, List } from 'react-native-paper';
import { CARD_PADDING } from '../../constants/card';
import type { MenuItemPoint } from '../../services/finance';
import { textSpacing, typography } from '../../styles/theme';

export type MenuItemType = 'Campeão' | 'Popular' | 'Promissor' | 'Dorminhoco' | 'Normal';

export const MENU_ITEM_TYPE_ORDER: MenuItemType[] = [
  'Campeão',
  'Popular',
  'Promissor',
  'Dorminhoco',
  'Normal',
];

export const MENU_ITEM_TYPE_STYLES: Record<MenuItemType, { icon: string; color: string }> = {
  'Campeão': { icon: 'trophy-award', color: '#FFC107' },
  'Popular': { icon: 'thumb-up-outline', color: '#4CAF50' },
  'Promissor': { icon: 'lightbulb-on-outline', color: '#007BFF' },
  'Dorminhoco': { icon: 'sleep', color: '#9E9E9E' },
  'Normal': { icon: 'circle-small', color: '#333' },
};

export function getMenuItemTypeStyle(type: string): { icon: string; color: string } {
  const key = type as MenuItemType;
  return MENU_ITEM_TYPE_STYLES[key] ?? MENU_ITEM_TYPE_STYLES.Normal;
}

type Props = {
  items: MenuItemPoint[];
  filters?: React.ReactNode;
};

export default function MenuMatrix({ items, filters }: Props) {
  return (
    <Card style={styles.container}>
      <Card.Title
        title="Engenharia de Cardápio"
        subtitle="Identifique seus produtos chave"
        titleStyle={{ fontSize: typography.cardTitle, fontWeight: '700', marginBottom: textSpacing.cardTitle }}
        subtitleStyle={{ fontSize: typography.cardDescription, opacity: 0.85, marginBottom: textSpacing.cardDescription }}
      />
      <Card.Content>
        {!!filters && <View style={styles.filtersContainer}>{filters}</View>}
        <List.Section>
          {items.map((item) => {
            const { icon, color } = getMenuItemTypeStyle(item.type);
            return (
              <List.Item
                key={item.id}
                title={item.name}
                description={`Faturamento: R$ ${item.revenue.toFixed(2)} | Vendas: ${item.volume} un.`}
                titleStyle={{ fontWeight: 'bold' }}
                left={props => <Avatar.Icon {...props} icon={icon} color={color} size={40} style={{ backgroundColor: 'transparent' }} />}
                right={() => <Chip style={{ backgroundColor: color, alignSelf: 'center' }} textStyle={{ color: 'white' }}>{item.type}</Chip>}
                style={styles.listItem}
              />
            );
          })}
        </List.Section>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginVertical: 8,
    padding: CARD_PADDING,
  },
  filtersContainer: {
    marginBottom: 8,
  },
  listItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 8,
  }
});

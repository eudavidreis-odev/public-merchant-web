import React from 'react';
import { StyleSheet } from 'react-native';
import { Avatar, Card, Chip, List } from 'react-native-paper';
import type { MenuItemPoint } from '../../services/finance';

const getIconForType = (type: string) => {
  switch (type) {
    case 'Campeão':
      return { icon: 'trophy-award', color: '#FFC107' };
    case 'Popular':
      return { icon: 'thumb-up-outline', color: '#4CAF50' };
    case 'Promissor':
      return { icon: 'lightbulb-on-outline', color: '#007BFF' };
    case 'Dorminhoco':
      return { icon: 'sleep', color: '#9E9E9E' };
    default:
      return { icon: 'circle-small', color: '#333' };
  }
};

type Props = { items: MenuItemPoint[] };

export default function MenuMatrix({ items }: Props) {
  return (
    <Card style={styles.container}>
      <Card.Title
        title="Engenharia de Cardápio"
        subtitle="Identifique seus produtos chave"
      />
      <Card.Content>
        <List.Section>
          {items.map((item) => {
            const { icon, color } = getIconForType(item.type);
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
  },
  listItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 8,
  }
});

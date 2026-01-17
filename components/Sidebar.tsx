
import { Link, usePathname } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { List } from 'react-native-paper';

const menuItems = [
  { key: 'index', title: 'Dashboard', icon: 'view-dashboard', path: '/' },
  { key: 'orders', title: 'Pedidos', icon: 'receipt', path: '/orders' },
  { key: 'products', title: 'Produtos', icon: 'package-variant-closed', path: '/products' },
  { key: 'finance', title: 'Finanças', icon: 'finance', path: '/finance' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <View style={styles.sidebar}>
      <List.Section>
        <List.Subheader>Lancheria Merchant</List.Subheader>
        {menuItems.map((item) => (
          <Link href={item.path as any} asChild key={item.key}>
            <List.Item
              title={item.title}
              left={(props) => <List.Icon {...props} icon={item.icon} />}
              style={pathname === item.path ? styles.activeItem : {}}
            />
          </Link>
        ))}
      </List.Section>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 250,
    backgroundColor: '#f7f7f7',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  },
  activeItem: {
    backgroundColor: '#e0e0e0',
  },
});

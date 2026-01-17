
import { Link, usePathname } from 'expo-router';
import { StyleSheet as RNStyleSheet, StyleSheet, Text, View } from 'react-native';
import { List, useTheme } from 'react-native-paper';

const menuItems = [
  { key: 'index', title: 'Dashboard', icon: 'view-dashboard', path: '/' },
  { key: 'orders', title: 'Pedidos', icon: 'receipt', path: '/orders' },
  { key: 'products', title: 'Produtos', icon: 'package-variant-closed', path: '/products' },
  { key: 'finance', title: 'Finanças', icon: 'finance', path: '/finance' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const theme = useTheme();

  return (
    <View style={styles.sidebar}>
      <View style={styles.brandBox}>
        <Text style={styles.brandTitle}>Lancheria Merchant</Text>
      </View>
      <List.Section>
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link href={item.path as any} asChild key={item.key}>
              <View
                style={RNStyleSheet.flatten([
                  styles.itemWrapper,
                  isActive && styles.itemActiveWrapper,
                ])}
              >
                <View
                  style={RNStyleSheet.flatten([
                    styles.activeBar,
                    isActive && { backgroundColor: theme.colors.primary },
                  ])}
                />
                <List.Item
                  title={item.title}
                  left={(props) => <List.Icon {...props} icon={item.icon} />}
                  style={RNStyleSheet.flatten([
                    styles.item,
                    isActive && styles.activeItem,
                  ])}
                />
              </View>
            </Link>
          );
        })}
      </List.Section>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 260,
    backgroundColor: '#f8fafc',
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  brandBox: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  itemWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemActiveWrapper: {
    backgroundColor: '#eef2ff',
  },
  activeBar: {
    width: 4,
    alignSelf: 'stretch',
    backgroundColor: 'transparent',
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  activeItem: {
    backgroundColor: 'transparent',
  },
  item: {
    paddingVertical: 12,
  },
},
);
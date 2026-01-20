import { Slot } from 'expo-router';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { MD3LightTheme, Provider as PaperProvider } from 'react-native-paper';
import Sidebar from '../components/Sidebar';
import { OrdersFiltersProvider } from '../contexts/OrdersFiltersContext';
import { ProductsFiltersProvider } from '../contexts/ProductsFiltersContext';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: 'tomato',
    secondary: 'yellow',
  },
};

export default function RootLayout() {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  return (
    <PaperProvider theme={theme}>
      <OrdersFiltersProvider>
        <ProductsFiltersProvider>
          <View style={styles.container}>
            {isDesktop && <Sidebar />}
            <View style={styles.content}>
              <Slot />
            </View>
          </View>
        </ProductsFiltersProvider>
      </OrdersFiltersProvider>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
import { Slot } from 'expo-router';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { MD3LightTheme, Provider as PaperProvider } from 'react-native-paper';
import ChatNotificationToast from '../components/ChatNotificationToast';
import Sidebar from '../components/Sidebar';
import { ChatNotificationsProvider, useChatNotifications } from '../contexts/ChatNotificationsContext';
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

function AppContent() {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const { currentNotification, dismissNotification } = useChatNotifications();

  return (
    <View style={styles.container}>
      {isDesktop && <Sidebar />}
      <View style={styles.content}>
        <Slot />
      </View>
      <ChatNotificationToast
        notification={currentNotification}
        onDismiss={dismissNotification}
        duration={5000}
      />
    </View>
  );
}

export default function RootLayout() {
  return (
    <PaperProvider theme={theme}>
      <ChatNotificationsProvider>
        <OrdersFiltersProvider>
          <ProductsFiltersProvider>
            <AppContent />
          </ProductsFiltersProvider>
        </OrdersFiltersProvider>
      </ChatNotificationsProvider>
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
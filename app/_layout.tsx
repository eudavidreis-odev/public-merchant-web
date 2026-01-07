import { Slot } from 'expo-router';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { MD3LightTheme, Provider as PaperProvider } from 'react-native-paper';
import Sidebar from '../components/Sidebar';

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
      <View style={styles.container}>
        {isDesktop && <Sidebar />}
        <View style={styles.content}>
          <Slot />
        </View>
      </View>
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
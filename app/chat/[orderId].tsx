import { Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import Chat from '../../components/chat/Chat';
import { auth } from '../../config/firebaseConfig';

// merchantId dinâmico via autenticação; sem fallback hardcoded

export default function ChatScreen() {
    const { orderId, merchantId: queryMerchantId } = useLocalSearchParams<{ orderId: string, merchantId?: string }>();
    const envMerchant = process.env.EXPO_PUBLIC_MERCHANT_ID as string | undefined;
    const merchantId = queryMerchantId || auth.currentUser?.uid || envMerchant || null;

    if (!orderId) {
        return (
            <View style={styles.centered}>
                <Text>ID do pedido não fornecido.</Text>
            </View>
        );
    }

    if (!merchantId) {
        return (
            <View style={styles.centered}>
                <Text>É necessário estar autenticado para abrir o chat do pedido.</Text>
            </View>
        );
    }

    const orderPath = `merchants/${merchantId}/pedidos/${orderId}`;

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: `Chat - Pedido ${orderId.substring(0, 6)}...` }} />
            <Chat orderPath={orderPath} merchantId={merchantId} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

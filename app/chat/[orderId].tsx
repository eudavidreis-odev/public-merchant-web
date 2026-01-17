import { Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import Chat from '../../components/chat/Chat';

// TODO: Substituir por um ID de lojista dinâmico vindo da autenticação
const HARDCODED_MERCHANT_ID = 'demo-merchant';

export default function ChatScreen() {
    const { orderId, merchantId: queryMerchantId } = useLocalSearchParams<{ orderId: string, merchantId?: string }>();

    // Usa o merchantId da query ou o valor fixo como fallback
    const merchantId = queryMerchantId || HARDCODED_MERCHANT_ID;

    if (!orderId) {
        return (
            <View style={styles.centered}>
                <Text>ID do pedido não fornecido.</Text>
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

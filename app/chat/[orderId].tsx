import { useNavigation } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Appbar, Text } from 'react-native-paper';
import Chat from '../../components/chat/Chat';
import { auth } from '../../config/firebaseConfig';
import * as OrdersService from '../../services/orders';

// merchantId dinâmico via autenticação; sem fallback hardcoded

export default function ChatScreen() {
    const { orderId, merchantId: queryMerchantId, returnTo, customerName: customerNameParam } = useLocalSearchParams<{
        orderId: string;
        merchantId?: string;
        returnTo?: string;
        customerName?: string;
    }>();
    const router = useRouter();
    const navigation = useNavigation();
    const envMerchant = process.env.EXPO_PUBLIC_MERCHANT_ID as string | undefined;
    const merchantId = queryMerchantId || auth.currentUser?.uid || envMerchant || null;

    const [customerName, setCustomerName] = useState<string | null>(customerNameParam ?? null);

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

    useEffect(() => {
        if (!orderId || !merchantId) return;

        if (customerNameParam) {
            setCustomerName(customerNameParam);
        }

        const unsub = OrdersService.subscribeOrderById(
            orderId,
            (o) => {
                if (o?.customerName) setCustomerName(o.customerName);
            },
            () => {
                // não bloqueia o chat se falhar
            },
            merchantId
        );

        return () => unsub?.();
    }, [orderId, merchantId, customerNameParam]);

    const orderPath = `merchants/${merchantId}/pedidos/${orderId}`;

    const headerTitle = useMemo(() => {
        const trimmedName = customerName && String(customerName).trim();
        const orderLabel = orderId ? `Pedido ${orderId}` : '';

        if (trimmedName) {
            return `${trimmedName} • ${orderLabel}`;
        }

        return orderLabel || 'Chat';
    }, [customerName, orderId]);

    const handleBack = () => {
        // Prioriza o destino explícito para manter o retorno consistente
        if (returnTo === 'orderDetail') {
            router.replace({
                pathname: '/orders/[orderId]',
                params: { orderId, merchantId },
            });
            return;
        }
        if (returnTo === 'orders') {
            router.replace('/orders');
            return;
        }

        // Fallback: se houver histórico de navegação, volta; senão, vai para /orders
        try {
            if (navigation.canGoBack()) {
                navigation.goBack();
                return;
            }
        } catch {
            // ignore
        }
        router.replace('/orders');
    };

    return (
        <View style={styles.container}>
            <Appbar.Header>
                <Appbar.BackAction onPress={handleBack} accessibilityLabel="Voltar" />
                <Appbar.Content title={headerTitle} />
            </Appbar.Header>
            <View style={styles.body}>
                <Chat orderPath={orderPath} merchantId={merchantId} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    body: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

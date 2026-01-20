import { useNavigation } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Appbar, Button, Text } from 'react-native-paper';
import OrderStatusChip from '../../components/OrderStatusChip';
import { auth } from '../../config/firebaseConfig';
import { CARD_PADDING } from '../../constants/card';
import * as OrdersService from '../../services/orders';
import { textSpacing, typography } from '../../styles/theme';
import type { Order } from '../../types';

function formatBRLFromCentavos(total_centavos: number): string {
    if (typeof total_centavos !== 'number') return 'R$ 0,00';
    try {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(total_centavos / 100);
    } catch {
        const fixed = (total_centavos / 100).toFixed(2).replace('.', ',');
        return `R$ ${fixed}`;
    }
}

function formatDateTime(ts?: any): string {
    if (!ts) return '-';
    try {
        const d = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts);
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(d);
    } catch {
        return '-';
    }
}

function formatPaymentMethod(method?: string): string {
    if (!method) return '-';
    switch (method) {
        case 'card':
            return 'Cartão';
        case 'pix':
            return 'Pix';
        case 'cash':
            return 'Dinheiro';
        default:
            return method;
    }
}

export default function OrderDetailScreen() {
    const { orderId, merchantId: queryMerchantId, returnTo } = useLocalSearchParams<{
        orderId: string;
        merchantId?: string;
        returnTo?: string;
    }>();

    const router = useRouter();
    const navigation = useNavigation();

    const envMerchant = process.env.EXPO_PUBLIC_MERCHANT_ID as string | undefined;
    const merchantId = queryMerchantId || auth.currentUser?.uid || envMerchant || null;

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!orderId || !merchantId) return;

        setLoading(true);
        setError(null);
        const unsub = OrdersService.subscribeOrderById(
            orderId,
            (o) => {
                setOrder(o);
                setLoading(false);
            },
            (e) => {
                setError(e.message);
                setLoading(false);
            },
            merchantId
        );

        return () => unsub?.();
    }, [orderId, merchantId]);

    const title = useMemo(() => {
        if (!orderId) return 'Pedido';
        return `Pedido #${orderId.substring(0, 6)}`;
    }, [orderId]);

    const handleBack = () => {
        if (returnTo === 'dashboard') {
            router.replace('/');
            return;
        }

        if (returnTo === 'orders') {
            router.replace('/orders');
            return;
        }

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
                <Text>É necessário estar autenticado para ver detalhes do pedido.</Text>
            </View>
        );
    }

    return (
        <View style={styles.screen}>
            <Appbar.Header>
                <Appbar.BackAction onPress={handleBack} accessibilityLabel="Voltar" />
                <Appbar.Content title={title} />
            </Appbar.Header>

            <ScrollView style={styles.container}>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Detalhes do Pedido</Text>
                    <Text style={styles.cardDescription}>Informações principais, status e pagamento.</Text>

                    {loading ? (
                        <View style={styles.centeredInline}>
                            <ActivityIndicator animating size="large" />
                            <Text style={{ marginTop: 6 }}>Carregando...</Text>
                        </View>
                    ) : error ? (
                        <Text style={{ marginTop: 6 }}>{error}</Text>
                    ) : !order ? (
                        <Text style={{ marginTop: 6 }}>Pedido não encontrado.</Text>
                    ) : (
                        <>
                            <View style={styles.row}>
                                <Text style={styles.label}>ID do pedido</Text>
                                <Text style={styles.value} numberOfLines={1}>
                                    {order.id}
                                </Text>
                            </View>

                            <View style={styles.row}>
                                <Text style={styles.label}>Merchant ID</Text>
                                <Text style={styles.value} numberOfLines={1}>
                                    {order.merchantId || merchantId}
                                </Text>
                            </View>

                            <View style={styles.row}>
                                <Text style={styles.label}>User ID</Text>
                                <Text style={styles.value} numberOfLines={1}>
                                    {order.userId || '-'}
                                </Text>
                            </View>

                            <View style={styles.row}>
                                <Text style={styles.label}>Status</Text>
                                <OrderStatusChip status={order.status} />
                            </View>

                            <View style={styles.row}>
                                <Text style={styles.label}>Total</Text>
                                <Text style={styles.value}>{formatBRLFromCentavos(order.total)}</Text>
                            </View>

                            <View style={styles.row}>
                                <Text style={styles.label}>Forma de pagamento</Text>
                                <Text style={styles.value}>{formatPaymentMethod(order.payment_method)}</Text>
                            </View>

                            <View style={styles.row}>
                                <Text style={styles.label}>Criado em</Text>
                                <Text style={styles.value}>{formatDateTime(order.createdAt)}</Text>
                            </View>

                            <View style={styles.row}>
                                <Text style={styles.label}>Pago em</Text>
                                <Text style={styles.value}>{formatDateTime(order.paidAt)}</Text>
                            </View>

                            <View style={styles.row}>
                                <Text style={styles.label}>Atualizado em</Text>
                                <Text style={styles.value}>{formatDateTime(order.updatedAt)}</Text>
                            </View>

                            <View style={styles.row}>
                                <Text style={styles.label}>Visualizado em</Text>
                                <Text style={styles.value}>{formatDateTime(order.viewedAt)}</Text>
                            </View>

                            <View style={styles.row}>
                                <Text style={styles.label}>Taxa de entrega</Text>
                                <Text style={styles.value}>
                                    {typeof order.delivery_fee_centavos === 'number'
                                        ? formatBRLFromCentavos(order.delivery_fee_centavos)
                                        : '-'}
                                </Text>
                            </View>

                            <View style={styles.row}>
                                <Text style={styles.label}>Moeda</Text>
                                <Text style={styles.value}>{order.currency?.toUpperCase?.() || '-'}</Text>
                            </View>

                            <View style={styles.row}>
                                <Text style={styles.label}>Payment Intent</Text>
                                <Text style={styles.value} numberOfLines={1}>
                                    {order.payment_intent_id || '-'}
                                </Text>
                            </View>

                            <View style={styles.row}>
                                <Text style={styles.label}>Stripe Account</Text>
                                <Text style={styles.value} numberOfLines={1}>
                                    {order.stripe_account_id ?? '-'}
                                </Text>
                            </View>

                            <View style={styles.row}>
                                <Text style={styles.label}>Cancelado em</Text>
                                <Text style={styles.value}>{formatDateTime(order.cancelledAt)}</Text>
                            </View>

                            <View style={styles.row}>
                                <Text style={styles.label}>Cancelado por</Text>
                                <Text style={styles.value} numberOfLines={1}>
                                    {order.cancelledBy || '-'}
                                </Text>
                            </View>

                            <View style={styles.row}>
                                <Text style={styles.label}>Endereço (ID)</Text>
                                <Text style={styles.value} numberOfLines={1}>
                                    {order.addressId || '-'}
                                </Text>
                            </View>

                            <View style={styles.row}>
                                <Text style={styles.label}>Mensagens</Text>
                                <Text style={styles.value}>
                                    {Array.isArray(order.messages)
                                        ? `${order.messages.length}`
                                        : order.messages
                                            ? 'Sim'
                                            : '-'}
                                </Text>
                            </View>

                            <View style={{ marginTop: 8 }}>
                                <Button
                                    mode="contained"
                                    onPress={() =>
                                        router.push({
                                            pathname: '/chat/[orderId]',
                                            params: {
                                                orderId: order.id,
                                                merchantId: order.merchantId,
                                                returnTo: 'orderDetail',
                                                customerName: order.customerName,
                                            },
                                        })
                                    }
                                >
                                    Abrir chat
                                </Button>
                            </View>

                            {Array.isArray(order.items) && order.items.length > 0 && (
                                <View style={{ marginTop: 12 }}>
                                    <Text style={styles.sectionTitle}>Itens</Text>
                                    {order.items.map((it, idx) => (
                                        <View key={`${it.name}-${idx}`} style={styles.itemRow}>
                                            <View style={{ flex: 1, paddingRight: 12 }}>
                                                <Text style={styles.itemName}>
                                                    {it.quantity}x {it.name}
                                                </Text>
                                                {(it.category || it.productId) && (
                                                    <Text style={styles.itemMeta} numberOfLines={1}>
                                                        {it.category ? `Categoria: ${it.category}` : ''}
                                                        {it.category && it.productId ? '  •  ' : ''}
                                                        {it.productId ? `Produto: ${it.productId}` : ''}
                                                    </Text>
                                                )}
                                            </View>
                                            {typeof it.price === 'number' ? (
                                                <Text style={styles.itemMeta}>R$ {it.price.toFixed(2)}</Text>
                                            ) : null}
                                        </View>
                                    ))}
                                </View>
                            )}
                        </>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
    },
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f4f4f4',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: CARD_PADDING,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    cardTitle: {
        fontSize: typography.cardTitle,
        fontWeight: '700',
        marginBottom: 2,
    },
    cardDescription: {
        opacity: 0.7,
        marginBottom: textSpacing.cardDescription,
        fontSize: typography.subtitle,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    centeredInline: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    label: {
        opacity: 0.7,
        fontSize: typography.body,
    },
    value: {
        fontSize: typography.body,
        fontWeight: '600',
        maxWidth: 220,
        textAlign: 'right',
    },
    sectionTitle: {
        fontSize: typography.heading5,
        fontWeight: '700',
        marginBottom: 6,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    itemName: {
        fontWeight: '600',
    },
    itemMeta: {
        opacity: 0.7,
    },
});


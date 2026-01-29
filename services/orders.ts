/**
 * @packageDocumentation
 * Serviço de pedidos para Merchant Web.
 * Conecta ao Firestore para leitura em tempo real e atualização de status.
 */

import {
    collection,
    doc,
    onSnapshot,
    orderBy,
    query,
    Timestamp,
    updateDoc
} from 'firebase/firestore';
import { auth, db } from '../config/firebaseConfig';
import type { Order } from '../types';
import { normalizeOrderStatus } from '../types/orderStatus';

// MerchantId dinâmico via autenticação; opcionalmente pode ser passado pela tela

export type FirestoreOrder = {
    status: Order['status'] | string;
    total_centavos: number;
    items: { name: string; quantity: number }[];
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
    userId?: string;
    customerName?: string; // Renomeado de userName para customerName
    merchantId?: string;
};

export type FirestoreOrderDetail = {
    messages?: unknown;
    status?: Order['status'] | string;
    total_centavos?: number;
    items?: Array<{
        name: string;
        quantity: number;
        category?: string;
        price?: number;
        productId?: string;
    }>;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
    paidAt?: Timestamp;
    cancelledAt?: Timestamp;
    viewedAt?: Timestamp;
    cancelledBy?: string;
    userId?: string;
    currency?: string;
    delivery_fee_centavos?: number;
    payment_method?: string;
    payment_intent_id?: string;
    stripe_account_id?: string | null;
    addressId?: string;
    customerName?: string;
    merchantId?: string;
};

/**
 * Assina pedidos em tempo real para um merchant específico.
 */
export function subscribeOrders(
    onUpdate: (orders: Order[]) => void,
    onError: (error: Error) => void,
    merchantIdOverride?: string,
): () => void {
    const envMerchant = process.env.EXPO_PUBLIC_MERCHANT_ID as string | undefined;
    const activeMerchantId = merchantIdOverride || auth.currentUser?.uid || envMerchant || null;
    if (!activeMerchantId) {
        console.warn('[OrdersService] merchantId não disponível (usuário não autenticado).');
        onError(new Error('Lojista não autenticado. Faça login para ver pedidos.'));
        return () => { };
    }
    // Consulta diretamente a subcoleção do merchant para evitar depender de campo merchantId no documento
    const ordersRef = collection(db, 'merchants', activeMerchantId, 'pedidos');
    const q = query(ordersRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
            const orders: Order[] = [];
            snapshot.forEach((document) => {
                const data = document.data() as FirestoreOrder;

                // Extrai o merchantId do path para garantir consistência
                let merchantId = data.merchantId;
                if (!merchantId && document.ref?.path) {
                    const parts = document.ref.path.split('/');
                    if (parts.length >= 3 && parts[0] === 'merchants') {
                        merchantId = parts[1];
                    }
                }

                const order: Order = {
                    id: document.id,
                    status: normalizeOrderStatus(data.status),
                    total: Number(data.total_centavos ?? 0),
                    items: Array.isArray(data.items) ? data.items : [],
                    createdAt: data.createdAt,
                    customerName: data.customerName || 'Cliente não identificado',
                    merchantId: merchantId,
                };
                orders.push(order);
            });
            onUpdate(orders);
        },
        (error) => {
            console.error('[OrdersService] Erro no snapshot dos pedidos: ', error);
            onError(new Error('Falha ao carregar pedidos em tempo real.'));
        }
    );

    return unsubscribe;
}

/**
 * Atualiza o status do pedido.
 * A referência ao documento agora precisa do caminho completo.
 */
export async function updateOrderStatus(
    merchantId: string,
    orderId: string,
    status: Order['status']
): Promise<void> {
    if (!merchantId || !orderId) {
        console.error('[OrdersService] ID do pedido ou do lojista ausente.');
        throw new Error(
            'ID do pedido ou do lojista ausente. Não é possível atualizar o status.'
        );
    }
    // Acessa a subcoleção 'pedidos' dentro do merchant específico
    const ref = doc(db, 'merchants', merchantId, 'pedidos', orderId);
    try {
        await updateDoc(ref, { status, updatedAt: Timestamp.now() });
    } catch (error) {
        console.error(`[OrdersService] Erro ao atualizar o status do pedido "${orderId}":`, error);
        throw error; // Re-lança o erro para o chamador lidar com a UI
    }
}

/**
 * Assina um único pedido (detalhe) em tempo real.
 */
export function subscribeOrderById(
    orderId: string,
    onUpdate: (order: Order | null) => void,
    onError: (error: Error) => void,
    merchantIdOverride?: string,
): () => void {
    const envMerchant = process.env.EXPO_PUBLIC_MERCHANT_ID as string | undefined;
    const activeMerchantId = merchantIdOverride || auth.currentUser?.uid || envMerchant || null;
    if (!activeMerchantId) {
        console.warn('[OrdersService] merchantId não disponível (usuário não autenticado).');
        onError(new Error('Lojista não autenticado. Faça login para ver pedidos.'));
        return () => { };
    }
    if (!orderId) {
        onError(new Error('ID do pedido não fornecido.'));
        return () => { };
    }

    const ref = doc(db, 'merchants', activeMerchantId, 'pedidos', orderId);

    const unsubscribe = onSnapshot(
        ref,
        (snap) => {
            if (!snap.exists()) {
                onUpdate(null);
                return;
            }
            const data = snap.data() as FirestoreOrderDetail;

            // Extrai o merchantId do path para garantir consistência
            let merchantId = data.merchantId;
            if (!merchantId && snap.ref?.path) {
                const parts = snap.ref.path.split('/');
                if (parts.length >= 3 && parts[0] === 'merchants') {
                    merchantId = parts[1];
                }
            }

            const totalCentavos = Number(data.total_centavos ?? 0);
            const order: Order = {
                id: snap.id,
                status: normalizeOrderStatus(data.status ?? ''),
                total: totalCentavos,
                messages: data.messages,
                items: Array.isArray(data.items) ? (data.items as any) : [],
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
                paidAt: data.paidAt,
                cancelledAt: data.cancelledAt,
                viewedAt: data.viewedAt,
                cancelledBy: data.cancelledBy,
                userId: data.userId,
                currency: data.currency,
                delivery_fee_centavos: data.delivery_fee_centavos,
                payment_method: data.payment_method,
                payment_intent_id: data.payment_intent_id,
                stripe_account_id: data.stripe_account_id ?? null,
                addressId: data.addressId,
                customerName: data.customerName || 'Cliente não identificado',
                merchantId,
            };
            onUpdate(order);
        },
        (error) => {
            console.error('[OrdersService] Erro no snapshot do pedido: ', error);
            onError(new Error('Falha ao carregar detalhes do pedido.'));
        }
    );

    return unsubscribe;
}

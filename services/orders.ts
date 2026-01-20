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
            console.log('[OrdersService] Recebido snapshot do Firestore:', snapshot.size, 'documentos.');
            const orders: Order[] = [];
            snapshot.forEach((document) => {
                const data = document.data() as FirestoreOrder;
                console.log('[OrdersService] Dados brutos do documento:', document.id, data);

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
            console.log('[OrdersService] Pedidos processados para atualização:', orders.length, 'pedidos.');
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
    console.log(`[OrdersService] Tentando atualizar status para "${status}" no pedido "${orderId}" do merchant "${merchantId}"`);
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
        console.log(`[OrdersService] Status do pedido "${orderId}" atualizado com sucesso para "${status}".`);
    } catch (error) {
        console.error(`[OrdersService] Erro ao atualizar o status do pedido "${orderId}":`, error);
        throw error; // Re-lança o erro para o chamador lidar com a UI
    }
}

/**
 * @packageDocumentation
 * Contexto de notificações de chat para o Merchant Web.
 * Gerencia contadores de mensagens não lidas e notificações.
 */

import { collection, getDocs, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ChatNotification } from '../components/ChatNotificationToast';
import { auth, db } from '../config/firebaseConfig';

export interface UnreadMessage {
    orderId: string;
    count: number;
    lastMessage?: {
        text: string;
        createdAt: any;
        customerName?: string;
    };
}

type ChatNotificationsContextValue = {
    unreadByOrder: Map<string, number>;
    totalUnread: number;
    markAsRead: (orderId: string) => Promise<void>;
    showNotification: (orderId: string, message: string, customerName?: string) => void;
};

const ChatNotificationsContext = createContext<ChatNotificationsContextValue | null>(null);

export function ChatNotificationsProvider({ children }: { children: React.ReactNode }) {
    const [unreadByOrder, setUnreadByOrder] = useState<Map<string, number>>(new Map());
    const [totalUnread, setTotalUnread] = useState(0);
    const [currentNotification, setCurrentNotification] = useState<ChatNotification | null>(null);
    const [lastMessageIds, setLastMessageIds] = useState<Set<string>>(new Set());

    const merchantId = auth.currentUser?.uid || process.env.EXPO_PUBLIC_MERCHANT_ID as string | undefined;

    // Listener para mensagens não lidas em todos os pedidos do lojista
    useEffect(() => {
        if (!merchantId) return;

        const ordersRef = collection(db, 'merchants', merchantId, 'pedidos');
        const unsubscribeCallbacks: (() => void)[] = [];

        // Subscribe aos pedidos
        const ordersQuery = query(ordersRef);
        const unsubOrders = onSnapshot(ordersQuery, (snapshot) => {
            // Limpar subscriptions antigas
            unsubscribeCallbacks.forEach(unsub => unsub());
            unsubscribeCallbacks.length = 0;

            snapshot.forEach((orderDoc) => {
                const orderId = orderDoc.id;
                const messagesRef = collection(orderDoc.ref, 'messages');

                // Subscribe às mensagens de cada pedido
                const messagesQuery = query(
                    messagesRef,
                    where('senderType', '==', 'customer')
                );

                const unsubMessages = onSnapshot(messagesQuery, (msgSnapshot) => {
                    // Verificar se há mensagens não lidas
                    const unreadMessages = msgSnapshot.docs.filter(
                        doc => doc.data().read !== true
                    );
                    const count = unreadMessages.length;

                    // Detectar nova mensagem e mostrar notificação
                    msgSnapshot.docChanges().forEach((change) => {
                        if (change.type === 'added') {
                            const messageData = change.doc.data();
                            const messageId = change.doc.id;

                            // Evitar mostrar notificação para mensagens antigas ao iniciar
                            setLastMessageIds((prevIds) => {
                                if (!prevIds.has(messageId)) {
                                    // Nova mensagem detectada
                                    if (messageData.senderType === 'customer' && messageData.read !== true) {
                                        // Buscar nome do cliente do pedido
                                        const orderData = orderDoc.data();
                                        const customerName = orderData?.customerName || 'Cliente';

                                        setCurrentNotification({
                                            orderId,
                                            customerName,
                                            message: messageData.text || 'Nova mensagem',
                                            timestamp: new Date(),
                                        });
                                    }

                                    const updated = new Set(prevIds);
                                    updated.add(messageId);
                                    return updated;
                                }
                                return prevIds;
                            });
                        }
                    });

                    setUnreadByOrder((prev) => {
                        const updated = new Map(prev);
                        if (count > 0) {
                            updated.set(orderId, count);
                        } else {
                            updated.delete(orderId);
                        }
                        return updated;
                    });
                });

                unsubscribeCallbacks.push(unsubMessages);
            });
        });

        return () => {
            unsubOrders();
            unsubscribeCallbacks.forEach(unsub => unsub());
        };
    }, [merchantId]);

    // Calcular total de não lidas
    useEffect(() => {
        const total = Array.from(unreadByOrder.values()).reduce((sum, count) => sum + count, 0);
        setTotalUnread(total);
    }, [unreadByOrder]);

    const markAsRead = useCallback(async (orderId: string) => {
        if (!merchantId) return;

        try {
            const messagesRef = collection(db, 'merchants', merchantId, 'pedidos', orderId, 'messages');
            const messagesQuery = query(
                messagesRef,
                where('senderType', '==', 'customer')
            );

            const snapshot = await getDocs(messagesQuery);
            const updates = snapshot.docs
                .filter(doc => doc.data().read !== true)
                .map(doc => updateDoc(doc.ref, { read: true }));

            await Promise.all(updates);

            // Atualizar estado local
            setUnreadByOrder((prev) => {
                const updated = new Map(prev);
                updated.delete(orderId);
                return updated;
            });
        } catch (error) {
            console.error('Erro ao marcar mensagens como lidas:', error);
        }
    }, [merchantId]);

    const dismissNotification = useCallback(() => {
        setCurrentNotification(null);
    }, []);

    const showNotification = useCallback((orderId: string, message: string, customerName?: string) => {
        setCurrentNotification({
            orderId,
            customerName: customerName || 'Cliente',
            message,
            timestamp: new Date(),
        });
    }, []);

    const value = {
        unreadByOrder,
        totalUnread,
        markAsRead,
        currentNotification,
        dismissNotification,
    };

    return (
        <ChatNotificationsContext.Provider value={value}>
            {children}
        </ChatNotificationsContext.Provider>
    );
}

export function useChatNotifications() {
    const ctx = useContext(ChatNotificationsContext);
    if (!ctx) {
        throw new Error('useChatNotifications deve ser usado dentro de ChatNotificationsProvider');
    }
    return ctx;
}

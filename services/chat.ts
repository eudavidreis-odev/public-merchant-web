/**
 * @packageDocumentation
 * Serviço de chat para o Merchant Web.
 * Gerencia o envio e recebimento de mensagens do Firestore para um pedido específico.
 */

import {
    addDoc,
    collection,
    doc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

export interface Message {
    id: string;
    text: string;
    createdAt: Timestamp;
    senderId: string;
    senderType: 'customer' | 'merchant';
}

/**
 * Assina para receber mensagens de um pedido em tempo real.
 * @param orderPath O caminho completo para o documento do pedido no Firestore.
 * @param onUpdate Callback chamado com a lista de mensagens atualizada.
 * @param onError Callback chamado em caso de erro.
 * @returns Uma função para cancelar a inscrição (unsubscribe).
 */
export function subscribeToMessages(
    orderPath: string,
    onUpdate: (messages: Message[]) => void,
    onError: (error: Error) => void
): () => void {
    try {
        const messagesRef = collection(doc(db, orderPath), 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const messages: Message[] = [];
            snapshot.forEach((doc) => {
                messages.push({ id: doc.id, ...doc.data() } as Message);
            });
            onUpdate(messages);
        }, (err) => {
            console.error("Falha ao ouvir mensagens do chat:", err);
            onError(new Error("Não foi possível carregar as mensagens."));
        });

        return unsubscribe;
    } catch (error) {
        console.error("Erro ao configurar a inscrição do chat:", error);
        onError(new Error("Erro ao iniciar o chat."));
        return () => { };
    }
}

/**
 * Envia uma nova mensagem para o chat de um pedido.
 * @param orderPath O caminho completo para o documento do pedido no Firestore.
 * @param text O conteúdo da mensagem.
 * @param senderId O ID do remetente (neste caso, o ID do lojista).
 */
export async function sendMessage(
    orderPath: string,
    text: string,
    senderId: string
): Promise<void> {
    if (!text.trim()) {
        throw new Error("A mensagem não pode estar vazia.");
    }

    try {
        const messagesRef = collection(doc(db, orderPath), 'messages');
        await addDoc(messagesRef, {
            text: text.trim(),
            createdAt: serverTimestamp(),
            senderId: senderId,
            senderType: 'merchant', // O remetente é sempre o lojista
        });
    } catch (error) {
        console.error("Erro ao enviar mensagem:", error);
        throw new Error("Falha ao enviar a mensagem.");
    }
}

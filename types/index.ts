import { Timestamp } from 'firebase/firestore';
import type { OrderStatus } from './orderStatus';

export type Product = {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    available?: boolean; // disponibilidade para pausar venda
    imageBase64?: string;
    imageMime?: string;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
};

export type Category = {
    id: string;
    name: string;
    icon?: string;
    createdAt?: Timestamp;
};

export type Order = {
    id: string;
    status: OrderStatus;
    total: number; // Alterado de total_centavos
    messages?: unknown;
    items: {
        name: string;
        quantity: number;
        category?: string;
        price?: number;
        productId?: string;
    }[];
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
    customerName?: string; // Adicionado para exibição
    merchantId?: string; // Necessário para a função de update
};

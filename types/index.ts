import { Timestamp } from 'firebase/firestore';

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
    status: 'Criado' | 'Confirmado' | 'Preparando' | 'Pronto' | 'Em entrega' | 'Entregue' | 'Cancelado';
    total: number; // Alterado de total_centavos
    items: { name: string; quantity: number }[];
    createdAt?: Timestamp;
    customerName?: string; // Adicionado para exibição
    merchantId?: string; // Necessário para a função de update
};

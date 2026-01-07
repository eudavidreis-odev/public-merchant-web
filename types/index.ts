import { Timestamp } from 'firebase/firestore';

export type Product = {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
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
    status: 'Criado' | 'Confirmado' | 'Preparando' | 'Pronto' | 'Entregue' | 'Cancelado';
    total_centavos: number;
    items: Array<{ name: string; quantity: number }>;
};

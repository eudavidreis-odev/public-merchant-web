
export type Product = {
    id: string;
    name: string;
    description: string;
    price: number;
    category: 'comida' | 'bebida';
    imageBase64?: string;
};

export type Order = {
    id: string;
    status: 'Criado' | 'Confirmado' | 'Preparando' | 'Pronto' | 'Entregue' | 'Cancelado';
    total_centavos: number;
    items: Array<{ name: string; quantity: number }>;
};

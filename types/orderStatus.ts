export const ORDER_STATUSES = [
    'Aguardando pagamento',
    'Pago',
    'Preparando',
    'Pronto',
    'Em entrega',
    'Entregue',
    'Cancelado',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type OrderStatusStyle = {
    icon: string;
    fg: string;
    bg: string;
};

export type OrderStatusMeta = OrderStatusStyle & {
    label: string;
    active: boolean;
};

export const ORDER_STATUS_META: Record<OrderStatus, OrderStatusMeta> = {
    'Aguardando pagamento': {
        label: 'Aguardando pagamento',
        icon: 'bell-outline',
        fg: '#9CA3AF',
        bg: '#F3F4F6',
        active: true,
    },
    Pago: {
        label: 'Pago',
        icon: 'check-circle-outline',
        fg: '#3B82F6',
        bg: '#EFF6FF',
        active: true,
    },
    Preparando: {
        label: 'Preparando',
        icon: 'pot-steam-outline',
        fg: '#F97316',
        bg: '#FFF7ED',
        active: true,
    },
    Pronto: {
        label: 'Pronto',
        icon: 'check-all',
        fg: '#EAB308',
        bg: '#FEFCE8',
        active: true,
    },
    'Em entrega': {
        label: 'Em entrega',
        icon: 'moped-outline',
        fg: '#8B5CF6',
        bg: '#F5F3FF',
        active: true,
    },
    Entregue: {
        label: 'Entregue',
        icon: 'package-variant-closed-check',
        fg: '#22C55E',
        bg: '#F0FDF4',
        active: false,
    },
    Cancelado: {
        label: 'Cancelado',
        icon: 'close-circle-outline',
        fg: '#EF4444',
        bg: '#FEF2F2',
        active: false,
    },
};

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = ORDER_STATUSES.filter(
    (s) => ORDER_STATUS_META[s].active
) as OrderStatus[];

export function getOrderStatusStyle(status: OrderStatus): OrderStatusStyle {
    const { icon, fg, bg } = ORDER_STATUS_META[status];
    return { icon, fg, bg };
}

export function getOrderStatusLabel(status: OrderStatus): string {
    return ORDER_STATUS_META[status].label;
}

export function isActiveOrderStatus(status: OrderStatus): boolean {
    return ACTIVE_ORDER_STATUSES.includes(status);
}

export function normalizeOrderStatus(rawStatus: unknown): OrderStatus {
    if (typeof rawStatus !== 'string') return 'Aguardando pagamento';

    const status = rawStatus.trim();

    // Compatibilidade: status antigos gravados no Firestore
    if (status === 'Criado') return 'Aguardando pagamento';
    if (status === 'Confirmado') return 'Pago';

    return (ORDER_STATUSES as readonly string[]).includes(status)
        ? (status as OrderStatus)
        : 'Aguardando pagamento';
}

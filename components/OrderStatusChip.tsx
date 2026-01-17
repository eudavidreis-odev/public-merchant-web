import React from 'react';
import { Chip, useTheme } from 'react-native-paper';
import type { Order } from '../../types';

type Status = Order['status'];

interface OrderStatusChipProps {
    status: Status;
    onPress?: () => void;
}

const statusStyles: Record<
    Status,
    {
        icon: string;
        color: string;
        backgroundColor: string;
    }
> = {
    Criado: {
        icon: 'bell-outline',
        color: '#f59e0b', // amber-500
        backgroundColor: '#fefce8', // yellow-50
    },
    Confirmado: {
        icon: 'check-circle-outline',
        color: '#3b82f6', // blue-500
        backgroundColor: '#eff6ff', // blue-50
    },
    Preparando: {
        icon: 'pot-steam-outline',
        color: '#3b82f6', // blue-500
        backgroundColor: '#eff6ff', // blue-50
    },
    Pronto: {
        icon: 'check-all',
        color: '#16a34a', // green-600
        backgroundColor: '#f0fdf4', // green-50
    },
    'Em entrega': {
        icon: 'moped-outline',
        color: '#16a34a', // green-600
        backgroundColor: '#f0fdf4', // green-50
    },
    Entregue: {
        icon: 'package-variant-closed-check',
        color: '#16a34a', // green-600
        backgroundColor: '#f0fdf4', // green-50
    },
    Cancelado: {
        icon: 'close-circle-outline',
        color: '#ef4444', // red-500
        backgroundColor: '#fef2f2', // red-50
    },
};

const OrderStatusChip: React.FC<OrderStatusChipProps> = ({
    status,
    onPress,
}) => {
    const theme = useTheme();
    const styles = statusStyles[status] || statusStyles['Criado'];

    return (
        <Chip
            icon={styles.icon}
            onPress={onPress}
            style={{ backgroundColor: styles.backgroundColor }}
            textStyle={{ color: styles.color, fontWeight: 'bold' }}>
            {status}
        </Chip>
    );
};

export default OrderStatusChip;

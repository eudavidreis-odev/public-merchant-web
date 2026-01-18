import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import type { Order } from '../../types';

type Status = Order['status'];

interface OrderStatusChipProps {
    status: Status;
    onPress?: () => void;
}

function getStatusColors(_theme: ReturnType<typeof useTheme>, status: Status) {
    // Paleta solicitada: ícone e texto na mesma cor específica
    switch (status) {
        case 'Criado':
            return { icon: 'bell-outline', fg: '#9CA3AF', bg: '#F3F4F6' }; // Cinza
        case 'Confirmado':
            return { icon: 'check-circle-outline', fg: '#3B82F6', bg: '#EFF6FF' }; // Azul
        case 'Preparando':
            return { icon: 'pot-steam-outline', fg: '#F97316', bg: '#FFF7ED' }; // Laranja
        case 'Pronto':
            return { icon: 'check-all', fg: '#EAB308', bg: '#FEFCE8' }; // Amarelo
        case 'Em entrega':
            return { icon: 'moped-outline', fg: '#8B5CF6', bg: '#F5F3FF' }; // Roxo
        case 'Entregue':
            return { icon: 'package-variant-closed-check', fg: '#22C55E', bg: '#F0FDF4' }; // Verde
        case 'Cancelado':
            return { icon: 'close-circle-outline', fg: '#EF4444', bg: '#FEF2F2' }; // Vermelho
        default:
            return { icon: 'information-outline', fg: '#374151', bg: '#E5E7EB' }; // Neutro
    }
}

const OrderStatusChip: React.FC<OrderStatusChipProps> = ({
    status,
    onPress,
}) => {
    const theme = useTheme();
    const c = getStatusColors(theme, status);

    return (
        <View style={StyleSheet.flatten([styles.badge, { backgroundColor: c.bg }])}>
            <MaterialCommunityIcons name={c.icon as any} size={16} color={c.fg} style={{ marginRight: 6 }} />
            <Text style={[styles.text, { color: c.fg }]} onPress={onPress}>{status}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 999,
    },
    text: {
        fontWeight: '700',
    },
});

export default OrderStatusChip;

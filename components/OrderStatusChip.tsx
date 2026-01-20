import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import type { OrderStatus } from '../types/orderStatus';
import { getOrderStatusLabel, getOrderStatusStyle } from '../types/orderStatus';

interface OrderStatusChipProps {
    status: OrderStatus;
    onPress?: () => void;
    selected?: boolean;
    style?: any;
}

const OrderStatusChip: React.FC<OrderStatusChipProps> = ({
    status,
    onPress,
    selected = false,
    style,
}) => {
    const c = getOrderStatusStyle(status);
    const label = getOrderStatusLabel(status);
    // Cores mais fortes para selecionado
    const strongBg = c.bg === '#EFF6FF' ? '#3B82F6' :
        c.bg === '#FEF2F2' ? '#EF4444' :
            c.bg === '#F0FDF4' ? '#22C55E' :
                c.bg === '#FEFCE8' ? '#EAB308' :
                    c.bg === '#F5F3FF' ? '#8B5CF6' :
                        c.bg === '#FFF7ED' ? '#F97316' :
                            c.bg === '#F3F4F6' ? '#9CA3AF' :
                                '#374151';
    const strongFg = '#fff';
    return (
        <View
            style={StyleSheet.flatten([
                styles.badge,
                { backgroundColor: selected ? strongBg : c.bg, borderWidth: selected ? 2 : 0, borderColor: selected ? strongBg : 'transparent' },
                style,
            ])}
        >
            <MaterialCommunityIcons name={c.icon as any} size={16} color={selected ? strongFg : c.fg} style={{ marginRight: 6 }} />
            <Text style={[styles.text, { color: selected ? strongFg : c.fg }]} onPress={onPress}>{label}</Text>
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

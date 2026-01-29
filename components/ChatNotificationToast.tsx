import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import { IconButton, Surface, Text } from 'react-native-paper';

export interface ChatNotification {
    orderId: string;
    customerName: string;
    message: string;
    timestamp: Date;
}

interface ChatNotificationToastProps {
    notification: ChatNotification | null;
    onDismiss: () => void;
    duration?: number; // Duração em ms antes de auto-fechar
}

/**
 * Toast de notificação para novas mensagens de chat
 * Aparece no topo da tela e pode ser clicado para abrir o chat
 */
export default function ChatNotificationToast({
    notification,
    onDismiss,
    duration = 5000,
}: ChatNotificationToastProps) {
    const router = useRouter();
    const [slideAnim] = useState(new Animated.Value(-100)); // Começa fora da tela

    useEffect(() => {
        if (notification) {
            // Animar entrada
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 50,
                friction: 7,
            }).start();

            // Auto-fechar após duração
            const timer = setTimeout(() => {
                handleDismiss();
            }, duration);

            return () => clearTimeout(timer);
        } else {
            // Animar saída
            Animated.timing(slideAnim, {
                toValue: -100,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [notification]);

    const handleDismiss = () => {
        Animated.timing(slideAnim, {
            toValue: -100,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            onDismiss();
        });
    };

    const handlePress = () => {
        if (notification) {
            router.push({
                pathname: '/chat/[orderId]',
                params: {
                    orderId: notification.orderId,
                    customerName: notification.customerName,
                    returnTo: 'notification',
                },
            });
            handleDismiss();
        }
    };

    if (!notification) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [{ translateY: slideAnim }],
                },
            ]}
        >
            <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
                <Surface style={styles.surface} elevation={4}>
                    <IconButton icon="message-text" size={24} style={styles.icon} />
                    <View style={styles.content}>
                        <Text variant="titleSmall" style={styles.title}>
                            {notification.customerName}
                        </Text>
                        <Text variant="bodyMedium" numberOfLines={2} style={styles.message}>
                            {notification.message}
                        </Text>
                    </View>
                    <IconButton icon="close" size={20} onPress={handleDismiss} style={styles.closeButton} />
                </Surface>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 50,
        left: 16,
        right: 16,
        zIndex: 9999,
    },
    surface: {
        backgroundColor: '#fff',
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    icon: {
        margin: 0,
        marginRight: 8,
    },
    content: {
        flex: 1,
    },
    title: {
        fontWeight: '600',
        marginBottom: 4,
    },
    message: {
        color: '#666',
    },
    closeButton: {
        margin: 0,
    },
});

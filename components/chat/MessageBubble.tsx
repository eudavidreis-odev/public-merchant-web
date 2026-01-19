import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { typography } from '../../styles/theme';

export default function MessageBubble({ text, isOwn, createdAt }: { text: string; isOwn?: boolean; createdAt?: any }) {
    const theme = useTheme();

    const formatTime = (timestamp: any) => {
        if (!timestamp) return '';
        const date = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const bubbleStyle = isOwn ? {
        backgroundColor: theme.colors.primary,
        borderTopRightRadius: 4,
    } : {
        backgroundColor: theme.colors.surfaceVariant,
        borderTopLeftRadius: 4,
    };

    const textStyle = {
        color: isOwn ? theme.colors.onPrimary : theme.colors.onSurfaceVariant,
    };

    const timestampStyle = {
        color: isOwn ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.5)',
    };

    const label = isOwn ? "Atendente" : "Cliente";

    return (
        <View style={[styles.container, isOwn ? styles.rightContainer : styles.leftContainer]}>
            <Text style={[styles.labelText, { color: theme.colors.onSurfaceDisabled }]}>{label}</Text>
            <View style={[styles.bubble, bubbleStyle]}>
                <Text style={[styles.text, textStyle]}>{text}</Text>
                {createdAt && (
                    <Text style={[styles.timestamp, timestampStyle]}>
                        {formatTime(createdAt)}
                    </Text>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingHorizontal: 12,
        marginVertical: 8, // Aumentado para dar espaço ao label
    },
    rightContainer: {
        alignItems: 'flex-end',
    },
    leftContainer: {
        alignItems: 'flex-start',
    },
    labelText: {
        fontSize: typography.helper,
        marginBottom: 4,
        paddingHorizontal: 4,
    },
    bubble: {
        maxWidth: '80%',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 16,
    },
    text: {
        fontSize: typography.heading5,
        lineHeight: 22,
    },
    timestamp: {
        fontSize: typography.caption,
        alignSelf: 'flex-end',
        marginTop: 4,
    },
});

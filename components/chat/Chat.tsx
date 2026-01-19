import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, TextInput, View } from 'react-native';
import { KeyboardGestureArea, KeyboardProvider, KeyboardStickyView } from 'react-native-keyboard-controller';
import { ActivityIndicator, IconButton, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ChatService from '../../services/chat';
import { typography } from '../../styles/theme';
import MessageBubble from './MessageBubble';

interface ChatProps {
    orderPath: string;
    merchantId: string;
}

export default function Chat({ orderPath, merchantId }: ChatProps) {
    const [messages, setMessages] = useState<ChatService.Message[]>([]);
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const theme = useTheme();
    const insets = useSafeAreaInsets();

    useEffect(() => {
        if (!orderPath) return;

        setLoading(true);
        const unsubscribe = ChatService.subscribeToMessages(
            orderPath,
            (newMessages) => {
                setMessages(newMessages);
                setLoading(false);
            },
            (error) => {
                Alert.alert("Erro no Chat", error.message);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [orderPath]);

    const handleSend = async () => {
        if (!text.trim()) return;
        setSending(true);
        try {
            await ChatService.sendMessage(orderPath, text, merchantId);
            setText('');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro.";
            Alert.alert("Erro ao Enviar", errorMessage);
        } finally {
            setSending(false);
        }
    };

    return (
        <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <View style={styles.body}>
                    {loading ? (
                        <View style={styles.centered}>
                            <ActivityIndicator size="large" />
                        </View>
                    ) : messages.length === 0 ? (
                        <View style={styles.centered}>
                            <Text>Nenhuma mensagem ainda.</Text>
                        </View>
                    ) : (
                        <KeyboardGestureArea style={styles.flex}>
                            <FlatList
                                data={messages}
                                inverted
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => (
                                    <MessageBubble
                                        text={item.text}
                                        isOwn={item.senderType === 'merchant'}
                                        createdAt={item.createdAt}
                                    />
                                )}
                                style={styles.flex}
                                contentContainerStyle={styles.listContent}
                                keyboardDismissMode="interactive"
                            />
                        </KeyboardGestureArea>
                    )}
                </View>

                <KeyboardStickyView
                    offset={{ closed: 0, opened: 0 }}
                    style={[styles.stickyInput, { backgroundColor: theme.colors.surface }]}
                >
                    <View style={[styles.inputContainer, {
                        borderTopColor: theme.colors.outlineVariant,
                        paddingBottom: Math.max(insets.bottom, 16)
                    }]}>
                        <TextInput
                            placeholder="Digite sua mensagem..."
                            placeholderTextColor={theme.colors.onSurfaceDisabled}
                            value={text}
                            onChangeText={setText}
                            style={[styles.textInput, {
                                backgroundColor: theme.colors.surfaceVariant,
                                color: theme.colors.onSurfaceVariant
                            }]}
                            multiline
                        />
                        <View>
                            {sending ? (
                                <ActivityIndicator size={24} />
                            ) : (
                                <IconButton
                                    icon="send"
                                    mode="contained"
                                    containerColor={theme.colors.primary}
                                    iconColor={theme.colors.onPrimary}
                                    size={24}
                                    onPress={handleSend}
                                    disabled={!text.trim()}
                                />
                            )}
                        </View>
                    </View>
                </KeyboardStickyView>
            </View>
        </KeyboardProvider>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    container: { flex: 1 },
    body: { flex: 1, overflow: 'hidden' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { paddingVertical: 16, paddingHorizontal: 16 },
    stickyInput: { width: '100%' },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 8,
        paddingVertical: 8,
        borderTopWidth: 1,
    },
    textInput: {
        flex: 1,
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: typography.heading5,
        maxHeight: 100,
        marginRight: 8,
    },
});

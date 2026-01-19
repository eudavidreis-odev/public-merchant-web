import * as React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Modal, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import ptBR from '../config/datepickerLocale';
import { typography } from '../styles/theme';

export type DateModalPickerProps = {
    label: string;
    selected: Date | null;
    onChange: (date: Date | null) => void;
    open: boolean;
    onClose: () => void;
    minDate?: Date;
    maxDate?: Date;
};

export default function DateModalPicker({ label, selected, onChange, open, onClose, minDate, maxDate }: DateModalPickerProps) {
    return (
        <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.label}>{label}</Text>
                    <DatePicker
                        selected={selected}
                        onChange={date => onChange(date)}
                        inline
                        locale={ptBR}
                        dateFormat="dd/MM/yyyy"
                        minDate={minDate}
                        maxDate={maxDate}
                    />
                    <Button mode="contained" style={styles.closeBtn} onPress={onClose}>Fechar</Button>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 99999,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        minWidth: 320,
        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
    },
    label: {
        fontWeight: 'bold',
        fontSize: typography.heading4,
        marginBottom: 12,
    },
    closeBtn: {
        marginTop: 16,
        borderRadius: 8,
    },
});

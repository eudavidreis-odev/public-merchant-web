import * as React from 'react';
import 'react-datepicker/dist/react-datepicker.css';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { palette } from '../styles/theme';
import DateModalPicker from './DateModalPicker';

export type DateRangePickerProps = {
    start: Date | null;
    end: Date | null;
    onChange: (range: { start: Date | null; end: Date | null }) => void;
};

export default function DateRangePicker({ start, end, onChange }: DateRangePickerProps) {
    const [openStart, setOpenStart] = React.useState(false);
    const [openEnd, setOpenEnd] = React.useState(false);


    // Cálculo de limites para seleção
    const today = new Date();
    // Data inicial: pode ser qualquer valor
    const minStart = undefined;
    const maxStart = today;

    // Data final: mínimo é data inicial, máximo é 3 meses depois da inicial (ou hoje se não houver inicial)
    const minEnd = start ? new Date(start) : undefined;
    let maxEnd = today;
    if (start) {
        maxEnd = new Date(start);
        maxEnd.setMonth(maxEnd.getMonth() + 3);
        if (maxEnd > today) maxEnd = today;
    }

    return (
        <View style={styles.container}>
            <View style={styles.inputsRow}>
                <TouchableOpacity style={styles.inputWrapper} onPress={() => setOpenStart(true)}>
                    <Text style={styles.label}>Início:</Text>
                    <Text style={styles.dateText}>{start ? start.toLocaleDateString('pt-BR') : 'Selecione'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.inputWrapper} onPress={() => setOpenEnd(true)}>
                    <Text style={styles.label}>Fim:</Text>
                    <Text style={styles.dateText}>{end ? end.toLocaleDateString('pt-BR') : 'Selecione'}</Text>
                </TouchableOpacity>
            </View>
            <DateModalPicker
                label="Selecionar data de início"
                selected={start}
                onChange={date => {
                    let newEnd = end;
                    if (date) {
                        // Se data final não existe ou intervalo > 3 meses, ajusta final
                        if (!end || (end && ((end.getTime() - date.getTime()) > 1000 * 60 * 60 * 24 * 92))) {
                            newEnd = new Date(date);
                            newEnd.setMonth(newEnd.getMonth() + 3);
                            if (newEnd > today) newEnd = today;
                        }
                        // Se data final for anterior à inicial, ajusta para inicial
                        if (end && end < date) newEnd = new Date(date);
                    }
                    onChange({ start: date, end: newEnd });
                    setOpenStart(false);
                }}
                open={openStart}
                onClose={() => setOpenStart(false)}
                minDate={minStart}
                maxDate={maxStart}
            />
            <DateModalPicker
                label="Selecionar data de fim"
                selected={end}
                onChange={date => {
                    // Garante que data final seja posterior à inicial
                    if (start && date && date < start) return;
                    onChange({ start, end: date });
                    setOpenEnd(false);
                }}
                open={openEnd}
                onClose={() => setOpenEnd(false)}
                minDate={minEnd}
                maxDate={maxEnd}
            />
        </View>
    );
}



const styles = StyleSheet.create({
    container: {
        flexDirection: 'column',
        marginVertical: 8,
    },
    inputsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        justifyContent: 'flex-start',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        paddingHorizontal: 12,
        paddingVertical: 6,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        marginRight: 8,
        minWidth: 140,
        cursor: 'pointer',
    },
    label: {
        marginRight: 8,
        fontWeight: '500',
    },
    dateText: {
        fontWeight: 'bold',
        color: palette.info,
        marginLeft: 4,
    },
});

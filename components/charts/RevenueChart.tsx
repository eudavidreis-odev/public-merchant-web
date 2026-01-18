import React, { useEffect, useMemo, useRef } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Text } from 'react-native-paper';
import { CARD_PADDING } from '../../constants/card';
import type { RevenuePoint } from '../../services/finance';

// --- CONFIGURAÇÕES VISUAIS ---
const SPACING = 60;
const INITIAL_SPACING = 20;
const Y_AXIS_WIDTH = 50
const TOOLTIP_WIDTH = 120;
const TOOLTIP_HEIGHT = 80; 

// AJUSTE VERTICAL (sobe o balão)
const OFFSET_Y = -130; 

// --- NOVO: CALIBRAÇÃO FINA DA SETA ---
// Se a seta está para a direita, coloque um valor negativo (ex: -2, -4, -10)
// Se estiver para a esquerda, coloque positivo.
const ARROW_X_ADJUST = -8.5;

type RevenueChartProps = {
    data: RevenuePoint[];
    title?: string;
};

const aggregateDataByDate = (rawData: RevenuePoint[]) => {
    const groupedMap = new Map<string, number>();
    rawData.forEach((item) => {
        const dateKey = item.label; 
        const currentTotal = groupedMap.get(dateKey) || 0;
        groupedMap.set(dateKey, currentTotal + item.value);
    });
    return Array.from(groupedMap.entries()).map(([label, value]) => ({
        label,
        value,
    }));
};

export default function RevenueChart({ data, title = 'Evolução da Receita' }: RevenueChartProps) {
    const chartRef = useRef<any>(null);
    const { width: screenWidth } = useWindowDimensions();

    const aggregatedData = useMemo(() => {
        if (!data || data.length === 0) return [];
        return aggregateDataByDate(data);
    }, [data]);

    const dataForChart = useMemo(() => {
        return aggregatedData.map((d) => ({
            value: d.value,
            label: d.label,
            dataPointColor: d.value === 0 ? '#ccc' : '#007BFF',
            dataPointRadius: 4,
            focusedDataPointColor: '#0056b3',
            focusedDataPointRadius: 6,
        }));
    }, [aggregatedData]);

    useEffect(() => {
        if (aggregatedData.length > 0) {
            setTimeout(() => {
                chartRef.current?.scrollToEnd({ animated: true });
            }, 500);
        }
    }, [aggregatedData]);

    const visibleChartWidth = screenWidth - (CARD_PADDING * 2) - Y_AXIS_WIDTH - 20;

    return (
        <View style={styles.container}>
            <Text variant="titleLarge" style={styles.title}>{title}</Text>
            
            <View style={styles.chartWrapper}>
                <LineChart
                    scrollRef={chartRef}
                    data={dataForChart}
                    
                    height={280}
                    width={visibleChartWidth}
                    
                    overflowTop={150} 
                    
                    spacing={SPACING}
                    initialSpacing={INITIAL_SPACING}
                    endSpacing={SPACING}
                    
                    color="#007BFF"
                    thickness={3}
                    startFillColor="rgba(0, 123, 255, 0.1)"
                    endFillColor="rgba(0, 123, 255, 0.01)"
                    areaChart
                    isAnimated
                    
                    yAxisLabelWidth={Y_AXIS_WIDTH}
                    yAxisTextStyle={{ color: 'gray', fontSize: 10 }}
                    xAxisLabelTextStyle={{ color: 'gray', width: 80, fontSize: 10 }}
                    yAxisThickness={0}
                    rulesType="solid"
                    rulesColor="#f0f0f0"
                    
                    textFontSize={12}
                    textColor="#333"

                    pointerConfig={{
                        pointerStripUptoDataPoint: true,
                        pointerColor: 'transparent',
                        pointerStripColor: 'transparent',
                        pointerStripWidth: 0,
                        radius: 0,
                        snapToPoint: true,
                        activatePointersOnLongPress: false,
                        autoAdjustPointerLabelPosition: false,

                        pointerLabelWidth: TOOLTIP_WIDTH,
                        pointerLabelHeight: TOOLTIP_HEIGHT,
                        
                        shiftPointerLabelX: 0,
                        shiftPointerLabelY: 0, 
                        
                        pointerLabelComponent: (items: any) => {
                            const item = items[0];
                            return (
                                <View style={styles.tooltipContainer}>
                                    <View style={styles.tooltipBubble}>
                                        <Text style={styles.tooltipLabel}>
                                            {item.label}
                                        </Text>
                                        <Text style={styles.tooltipValue}>
                                            R$ {item.value?.toFixed(2)}
                                        </Text>
                                    </View>
                                    <View style={styles.tooltipArrow} />
                                </View>
                            );
                        },
                    }}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        padding: CARD_PADDING,
        borderRadius: 8,
        marginVertical: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        zIndex: 1,
        ...Platform.select({
            android: { elevation: 2 },
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.08,
                shadowRadius: 3,
            },
            default: {
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            },
        }),
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    chartWrapper: {
        overflow: 'visible',
        paddingVertical: 10,
        paddingTop: 40, 
    },
    tooltipContainer: {
        width: TOOLTIP_WIDTH,
        // Garante que os filhos (bolha e seta) sejam centralizados
        alignItems: 'center', 
        transform: [
            { translateX: -(TOOLTIP_WIDTH / 2) },
            { translateY: OFFSET_Y }
        ],
    },
    tooltipBubble: {
        paddingVertical: 8,
        paddingHorizontal: 10,
        backgroundColor: '#1a1a1a',
        borderRadius: 6,
        alignItems: 'center',
        width: '100%',
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    tooltipLabel: {
        color: '#ccc',
        fontSize: 10,
        marginBottom: 2,
        textAlign: 'center',
    },
    tooltipValue: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
        textAlign: 'center',
    },
    tooltipArrow: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderTopWidth: 8,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: '#1a1a1a',
        marginTop: -1,
        
        // --- APLICAÇÃO DA CALIBRAÇÃO ---
        alignSelf: 'center', // Reforça a centralização
        transform: [{ translateX: ARROW_X_ADJUST }] // Move apenas a seta pixel a pixel
    }
});
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
    const dragWrapperRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const dragStartX = useRef<number | null>(null);
    const dragStartScroll = useRef<number | null>(null);
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

    // Cálculo da largura visível estrita
    // Ajuste extra para garantir que não vaze: 8px
    const ADJUST_EXTRA = 8;
    const visibleChartWidth = Math.min(
        screenWidth - (CARD_PADDING * 2) - Y_AXIS_WIDTH - ADJUST_EXTRA,
        screenWidth
    );

    // Spacing fixo para teste
    const dynamicSpacing = 60;
    const initialSpacing = INITIAL_SPACING;
    const endSpacing = SPACING;

    // --- Drag logic para Web ---
    // Só ativa no ambiente Web
    const isWeb = Platform.OS === 'web';

    // Funções de arraste
    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isWeb) return;
        setIsDragging(true);
        dragStartX.current = e.pageX;
        // O elemento de scroll é o scrollRef.current (div interna do gifted-charts)
        if (chartRef.current && chartRef.current.scrollLeft !== undefined) {
            dragStartScroll.current = chartRef.current.scrollLeft;
        } else if (dragWrapperRef.current) {
            dragStartScroll.current = dragWrapperRef.current.scrollLeft;
        }
    };

    const handleMouseUp = () => {
        if (!isWeb) return;
        setIsDragging(false);
        dragStartX.current = null;
        dragStartScroll.current = null;
    };

    const handleMouseLeave = () => {
        if (!isWeb) return;
        setIsDragging(false);
        dragStartX.current = null;
        dragStartScroll.current = null;
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isWeb || !isDragging || dragStartX.current === null || dragStartScroll.current === null) return;
        const deltaX = dragStartX.current - e.pageX;
        // Manipula scroll do elemento correto
        if (chartRef.current && chartRef.current.scrollLeft !== undefined) {
            chartRef.current.scrollLeft = dragStartScroll.current + deltaX;
        } else if (dragWrapperRef.current) {
            dragWrapperRef.current.scrollLeft = dragStartScroll.current + deltaX;
        }
    };

    // Adiciona/remover listeners globais para mouseup (caso o usuário solte fora do container)
    useEffect(() => {
        if (!isWeb) return;
        if (isDragging) {
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isWeb]);

    return (
        <View style={styles.container}>
            <Text variant="titleLarge" style={styles.title}>{title}</Text>
            {/* Wrapper extra para eventos de mouse no Web */}
            <div
                ref={dragWrapperRef}
                style={{
                    ...styles.chartWrapper,
                    cursor: isWeb ? (isDragging ? 'grabbing' : 'grab') : undefined,
                }}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onMouseMove={handleMouseMove}
            >
                <LineChart
                    scrollRef={chartRef}
                    data={dataForChart}
                    height={280}
                    width={visibleChartWidth}
                    overflowTop={150}
                    spacing={dynamicSpacing}
                    initialSpacing={initialSpacing}
                    endSpacing={endSpacing}
                    color="#007BFF"
                    thickness={3}
                    startFillColor="rgba(0, 123, 255, 0.1)"
                    endFillColor="rgba(0, 123, 255, 0.01)"
                    areaChart
                    isAnimated={false}
                    yAxisLabelWidth={Y_AXIS_WIDTH}
                    yAxisTextStyle={{ color: 'gray', fontSize: 10 }}
                    xAxisLabelTextStyle={{ color: 'gray', width: 80, fontSize: 10 }}
                    yAxisThickness={0}
                    rulesType="solid"
                    rulesColor="#f0f0f0"
                    textFontSize={12}
                    textColor="#333"
                    yAxisIsFixed={true}
                    nestedScrollEnabled={true}
                    disableScroll={false}
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
            </div>
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
        width: '100%',
        overflow: 'hidden',
        paddingVertical: 10,
        paddingTop: 40,
        // cursor será sobrescrito inline no Web
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
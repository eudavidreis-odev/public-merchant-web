import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Text } from 'react-native-paper';
import { CARD_PADDING } from '../../constants/card';
import type { FinancePeriod, RevenuePoint } from '../../services/finance';
import { palette, textSpacing, typography } from '../../styles/theme';

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
    period?: FinancePeriod;
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

export default function RevenueChart({ data, title = 'Evolução da Receita', period }: RevenueChartProps) {
    const chartRef = useRef<any>(null);
    const dragWrapperRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [wrapperWidth, setWrapperWidth] = useState(0);
    const dragStartX = useRef<number | null>(null);
    const dragStartScroll = useRef<number | null>(null);
    const { width: screenWidth } = useWindowDimensions();

    const aggregatedData = useMemo(() => {
        if (!data || data.length === 0) return [];
        return aggregateDataByDate(data);
    }, [data]);

    // Formata os dados para o `LineChart` (react-native-gifted-charts)
    const dataForChart = useMemo(() => {
        return aggregatedData.map((d) => ({
            value: d.value,
            label: d.label,
        }));
    }, [aggregatedData]);

    // Rewritten clean implementation below - fixes malformed JSX and logic
    const ADJUST_EXTRA = 8;

    // Mede a largura real do container do gráfico para evitar "cortes" no fim
    // quando o layout responsivo não bate exatamente com `screenWidth`.
    const measuredContainerWidth = wrapperWidth > 0 ? wrapperWidth : Math.max(0, screenWidth - CARD_PADDING * 2);
    const visibleChartWidth = Math.max(
        0,
        Math.min(measuredContainerWidth - Y_AXIS_WIDTH - ADJUST_EXTRA, measuredContainerWidth)
    );

    const isToday = period === 'today';

    const baseSpacing = SPACING;
    const baseInitialSpacing = INITIAL_SPACING;
    const baseEndSpacing = SPACING;

    // Labels do eixo X precisam de folga no começo/fim para não serem cortados
    // pelo `overflow: 'hidden'` do card.
    const xLabelWidth = isToday ? 48 : 80;
    const edgePaddingToday = Math.ceil(xLabelWidth / 2) + 6;
    const edgePaddingNonTodayStart = Math.ceil(80 / 2) + 6; // suficiente p/ exibir datas (DD/MM/AA)

    const initialSpacing = isToday ? edgePaddingToday : Math.max(baseInitialSpacing, edgePaddingNonTodayStart);
    const endSpacing = isToday ? edgePaddingToday : baseEndSpacing;

    const fixedSpacing = useMemo(() => {
        if (!isToday) return baseSpacing;
        if (dataForChart.length <= 1) return baseSpacing;

        // Distribui igualmente os pontos usando toda a largura visível.
        const usable = Math.max(0, visibleChartWidth - initialSpacing - endSpacing);
        const s = usable / (dataForChart.length - 1);

        // Evita spacing muito pequeno (pontos amontoados) e também previne casos extremos.
        return Math.min(80, Math.max(6, Math.floor(s)));
    }, [isToday, dataForChart.length, visibleChartWidth, baseSpacing, initialSpacing, endSpacing]);

    const spacing = isToday ? fixedSpacing : baseSpacing;

    const isWeb = Platform.OS === 'web';
    const disableScroll = isToday;

    const getChartScrollNode = () => {
        const ref = chartRef.current as any;
        if (!ref) return null;
        // RN Web ScrollView costuma expor `getScrollableNode()`
        if (typeof ref.getScrollableNode === 'function') {
            const node = ref.getScrollableNode();
            if (node) return node as any;
        }
        return ref as any;
    };

    const getScrollX = () => {
        const node = getChartScrollNode();
        const x = node?.scrollLeft;
        return typeof x === 'number' ? x : 0;
    };

    const setScrollX = (x: number) => {
        const node = getChartScrollNode();
        if (!node) return;

        // Preferir API RN (quando existir) para não bagunçar layout do eixo Y.
        if (typeof node.scrollTo === 'function') {
            try {
                node.scrollTo({ x, animated: false });
                return;
            } catch {
                // fallback abaixo
            }
        }

        if (typeof node.scrollLeft === 'number') {
            const maxX = Math.max(0, (node.scrollWidth || 0) - (node.clientWidth || 0));
            node.scrollLeft = Math.max(0, Math.min(maxX, x));
        }
    };

    const handleMouseDown = (e: any) => {
        if (!isWeb) return;
        setIsDragging(true);
        try {
            e?.preventDefault?.();
        } catch {
            // noop
        }
        dragStartX.current = e.pageX ?? e.nativeEvent?.pageX ?? null;
        dragStartScroll.current = getScrollX();

        // Evita seleção de texto durante o drag (deixa o comportamento mais suave no web)
        try {
            document.body.style.userSelect = 'none';
        } catch {
            // noop
        }
    };

    const handleMouseUp = () => {
        if (!isWeb) return;
        setIsDragging(false);
        dragStartX.current = null;
        dragStartScroll.current = null;

        try {
            document.body.style.userSelect = '';
        } catch {
            // noop
        }
    };

    const handleMouseLeave = () => {
        if (!isWeb) return;
        setIsDragging(false);
        dragStartX.current = null;
        dragStartScroll.current = null;

        try {
            document.body.style.userSelect = '';
        } catch {
            // noop
        }
    };

    const handleMouseMove = (e: any) => {
        if (!isWeb) return;
        if (!isDragging || dragStartX.current === null || dragStartScroll.current === null) return;
        const pageX = e.pageX ?? e.nativeEvent?.pageX ?? 0;
        const delta = dragStartX.current - pageX;
        const newScroll = (dragStartScroll.current || 0) + delta;
        setScrollX(newScroll);
    };

    useEffect(() => {
        if (disableScroll) return;
        if (aggregatedData.length > 0) {
            setTimeout(() => {
                try {
                    chartRef.current?.scrollToEnd?.({ animated: true });
                } catch { }
            }, 500);
        }
    }, [aggregatedData, disableScroll]);

    useEffect(() => {
        if (!isWeb) return;
        const onWindowUp = () => handleMouseUp();
        if (isDragging) window.addEventListener('mouseup', onWindowUp);
        return () => window.removeEventListener('mouseup', onWindowUp);
    }, [isDragging, isWeb]);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.subtitle}>
                    {isToday
                        ? 'Evolução por hora do faturamento de hoje.'
                        : 'Evolução diária do faturamento no período selecionado.'}
                </Text>
            </View>

            {isWeb && !disableScroll ? (
                <div
                    ref={dragWrapperRef}
                    style={{ ...styles.chartWrapper, cursor: isDragging ? 'grabbing' : 'grab' }}
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
                        spacing={spacing}
                        initialSpacing={initialSpacing}
                        endSpacing={endSpacing}
                        color={palette.info}
                        thickness={3}
                        startFillColor="rgba(2,136,209,0.10)"
                        endFillColor="rgba(2,136,209,0.01)"
                        areaChart
                        isAnimated={false}
                        yAxisLabelWidth={Y_AXIS_WIDTH}
                        yAxisTextStyle={{ color: palette.gray600, fontSize: typography.body }}
                        xAxisLabelTextStyle={{
                            color: palette.gray600,
                            width: isToday ? 48 : 80,
                            fontSize: isToday ? 10 : typography.body,
                        }}
                        yAxisThickness={0}
                        rulesType="solid"
                        rulesColor={palette.gray200}
                        textFontSize={typography.body}
                        textColor={palette.gray900}
                        nestedScrollEnabled={true}
                        disableScroll={disableScroll}
                        pointerConfig={{
                            pointerStripUptoDataPoint: true,
                            pointerColor: 'transparent',
                            pointerStripColor: 'transparent',
                            pointerStripWidth: 0,
                            radius: 0,
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
                                            <Text style={styles.tooltipLabel}>{item.label}</Text>
                                            <Text style={styles.tooltipValue}>R$ {item.value?.toFixed(2)}</Text>
                                        </View>
                                        <View style={styles.tooltipArrow} />
                                    </View>
                                );
                            },
                        }}
                    />
                </div>
            ) : (
                <View
                    style={styles.chartWrapper}
                    ref={dragWrapperRef as any}
                    onLayout={(e) => {
                        const w = e?.nativeEvent?.layout?.width;
                        if (typeof w === 'number' && w > 0) setWrapperWidth(w);
                    }}
                >
                    <LineChart
                        scrollRef={chartRef}
                        data={dataForChart}
                        height={280}
                        width={visibleChartWidth}
                        overflowTop={150}
                        spacing={spacing}
                        initialSpacing={initialSpacing}
                        endSpacing={endSpacing}
                        color={palette.info}
                        thickness={3}
                        startFillColor="rgba(2,136,209,0.10)"
                        endFillColor="rgba(2,136,209,0.01)"
                        areaChart
                        isAnimated={false}
                        yAxisLabelWidth={Y_AXIS_WIDTH}
                        yAxisTextStyle={{ color: palette.gray600, fontSize: typography.body }}
                        xAxisLabelTextStyle={{
                            color: palette.gray600,
                            width: isToday ? 48 : 80,
                            fontSize: isToday ? 10 : typography.body,
                        }}
                        yAxisThickness={0}
                        rulesType="solid"
                        rulesColor={palette.gray200}
                        textFontSize={typography.body}
                        textColor={palette.gray900}
                        nestedScrollEnabled={true}
                        disableScroll={disableScroll}
                        pointerConfig={{
                            pointerStripUptoDataPoint: true,
                            pointerColor: 'transparent',
                            pointerStripColor: 'transparent',
                            pointerStripWidth: 0,
                            radius: 0,
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
                                            <Text style={styles.tooltipLabel}>{item.label}</Text>
                                            <Text style={styles.tooltipValue}>R$ {item.value?.toFixed(2)}</Text>
                                        </View>
                                        <View style={styles.tooltipArrow} />
                                    </View>
                                );
                            },
                        }}
                    />
                </View>
            )}
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
    header: {
        padding: 16,
    },
    title: {
        fontSize: typography.cardTitle,
        fontWeight: '700',
        color: palette.gray900,
        marginBottom: textSpacing.cardTitle,
        letterSpacing: 0.1,
    },
    subtitle: {
        fontSize: typography.cardDescription,
        color: palette.gray700,
        opacity: 0.85,
        marginBottom: textSpacing.cardDescription,
    },
    chartWrapper: {
        width: '100%',
        overflow: 'hidden',
        paddingVertical: 10,
        paddingTop: 40,
    },
    tooltipContainer: {
        width: TOOLTIP_WIDTH,
        alignItems: 'center',
        transform: [{ translateX: -(TOOLTIP_WIDTH / 2) }, { translateY: OFFSET_Y }],
    },
    tooltipBubble: {
        paddingVertical: 8,
        paddingHorizontal: 10,
        backgroundColor: '#1a1a1a',
        borderRadius: 6,
        alignItems: 'center',
        width: '100%',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    tooltipLabel: {
        color: '#ccc',
        fontSize: typography.caption,
        marginBottom: 2,
        textAlign: 'center',
    },
    tooltipValue: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: typography.body,
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
        alignSelf: 'center',
        transform: [{ translateX: ARROW_X_ADJUST }],
    },
});


// Removida declaração duplicada de `styles` (mantida a primeira ocorrência acima)
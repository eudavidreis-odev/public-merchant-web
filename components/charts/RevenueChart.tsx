
import React, { useEffect, useMemo, useRef } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Text } from 'react-native-paper';
import type { RevenuePoint } from '../../services/finance';

type RevenueChartProps = {
    data: RevenuePoint[];
    title?: string;
};

export default function RevenueChart({ data, title = 'Evolução da Receita' }: RevenueChartProps) {
    const scrollViewRef = useRef<ScrollView>(null);
    const { width: screenWidth } = useWindowDimensions();

    // Smart Width Calculation
    const chartWidth = Math.max(screenWidth - 80, data.length * 50);

    // Reduz rótulos do eixo X para evitar sobreposição: mostra a cada 'step'
    const dataForChart = useMemo(() => {
        const n = Math.max(data.length, 1);
        const step = n <= 10 ? 1 : Math.ceil(n / 4); // 4 marcações principais
        return data.map((d, idx) => ({
            ...d,
            label: idx % step === 0 ? d.label : '',
        }));
    }, [data]);

    useEffect(() => {
        // Scroll to the end to show the most recent data point
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }, [data]);

    return (
        <View style={styles.container}>
            <Text variant="titleLarge" style={styles.title}>{title}</Text>
            <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
            >
                <LineChart
                    data={dataForChart}
                    height={250}
                    width={chartWidth}
                    color="#007BFF"
                    thickness={3}
                    startFillColor="rgba(0, 123, 255, 0.1)"
                    endFillColor="rgba(0, 123, 255, 0.01)"
                    areaChart
                    yAxisTextStyle={{ color: 'gray' }}
                    xAxisLabelTextStyle={{ color: 'gray', height: 40 }}
                    initialSpacing={15}
                    endSpacing={15}
                    spacing={chartWidth / (data.length > 1 ? data.length - 1 : 1) - (data.length > 10 ? 15 : 0)} // Adjust spacing based on width
                    dataPointsColor="#007BFF"
                    textColor="black"
                    textFontSize={12}
                    isAnimated
                />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        marginVertical: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    scrollView: {
        maxWidth: '100%',
    },
    scrollContent: {
        paddingRight: 16,
    },
});

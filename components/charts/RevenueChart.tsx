
import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions, Text } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

// Mock data similar to what useFinanceMetrics would provide
const mockData = {
    daily: Array.from({ length: 12 }, (_, i) => ({
        value: Math.floor(Math.random() * 500) + 100,
        label: `${i * 2}:00`,
    })),
    monthly: Array.from({ length: 30 }, (_, i) => ({
        value: Math.floor(Math.random() * 8000) + 2000,
        label: `${i + 1}`,
        dataPointText: `R$${((Math.floor(Math.random() * 8000) + 2000)/1000).toFixed(1)}k`
    })),
};

type RevenueChartProps = {
    period: 'daily' | 'monthly';
};

export default function RevenueChart({ period }: RevenueChartProps) {
    const scrollViewRef = useRef<ScrollView>(null);
    const { width: screenWidth } = useWindowDimensions();
    const data = period === 'daily' ? mockData.daily : mockData.monthly;

    // Smart Width Calculation
    const chartWidth = Math.max(screenWidth - 80, data.length * 50);

    useEffect(() => {
        // Scroll to the end to show the most recent data point
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }, [period]);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Evolução da Receita</Text>
            <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
            >
                <LineChart
                    data={data}
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
                    spacing={chartWidth / (data.length > 1 ? data.length - 1 : 1) - (data.length > 10 ? 15:0) } // Adjust spacing based on width
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

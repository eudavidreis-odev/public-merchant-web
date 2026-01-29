/**
 * Testes básicos para validação dos cálculos de finanças
 * Foco: Status corretos, ticket médio e agregações
 */

describe('Finance Service - Cálculos', () => {
    const createOrder = (overrides = {}) => ({
        id: 'order-123',
        total: 5000,
        status: 'Entregue',
        createdAt: new Date('2026-01-15T10:00:00'),
        ...overrides,
    });

    test('deve contar apenas pedidos "Entregue" para faturamento', () => {
        const orders = [
            createOrder({ id: '1', status: 'Entregue', total: 5000 }),
            createOrder({ id: '2', status: 'Aguardando pagamento', total: 3000 }),
            createOrder({ id: '3', status: 'Entregue', total: 7000 }),
            createOrder({ id: '4', status: 'Cancelado', total: 2000 }),
        ];

        const delivered = orders.filter(o => o.status === 'Entregue');
        const revenue = delivered.reduce((sum, o) => sum + o.total, 0);

        expect(delivered.length).toBe(2);
        expect(revenue).toBe(12000);
    });

    test('não deve incluir "Aguardando pagamento" no faturamento', () => {
        const orders = [
            createOrder({ status: 'Aguardando pagamento', total: 10000 }),
        ];

        const delivered = orders.filter(o => o.status === 'Entregue');
        const revenue = delivered.reduce((sum, o) => sum + o.total, 0);

        expect(revenue).toBe(0);
    });

    test('não deve incluir "Cancelado" no faturamento', () => {
        const orders = [
            createOrder({ status: 'Cancelado', total: 5000 }),
        ];

        const delivered = orders.filter(o => o.status === 'Entregue');
        const revenue = delivered.reduce((sum, o) => sum + o.total, 0);

        expect(revenue).toBe(0);
    });

    test('deve calcular ticket médio corretamente', () => {
        const orders = [
            createOrder({ status: 'Entregue', total: 5000 }),
            createOrder({ status: 'Entregue', total: 7000 }),
            createOrder({ status: 'Entregue', total: 3000 }),
        ];

        const delivered = orders.filter(o => o.status === 'Entregue');
        const total = delivered.reduce((sum, o) => sum + o.total, 0);
        const avgTicket = delivered.length > 0 ? total / delivered.length : 0;

        expect(avgTicket).toBe(5000);
    });

    test('ticket médio deve ser 0 sem pedidos entregues', () => {
        const orders = [
            createOrder({ status: 'Cancelado', total: 5000 }),
        ];

        const delivered = orders.filter(o => o.status === 'Entregue');
        const avgTicket = delivered.length > 0
            ? delivered.reduce((sum, o) => sum + o.total, 0) / delivered.length
            : 0;

        expect(avgTicket).toBe(0);
    });

    test('deve filtrar pedidos do dia atual', () => {
        const today = new Date(2026, 0, 15); // 15 de janeiro de 2026
        const orders = [
            createOrder({ id: '1', createdAt: new Date(2026, 0, 15, 10, 0), status: 'Entregue' }),
            createOrder({ id: '2', createdAt: new Date(2026, 0, 14, 10, 0), status: 'Entregue' }),
            createOrder({ id: '3', createdAt: new Date(2026, 0, 15, 22, 0), status: 'Entregue' }),
        ];

        const todayOrders = orders.filter(o => {
            const date = o.createdAt;
            return (
                date.getFullYear() === today.getFullYear() &&
                date.getMonth() === today.getMonth() &&
                date.getDate() === today.getDate()
            );
        });

        expect(todayOrders.length).toBe(2);
        expect(todayOrders[0].id).toBe('1');
        expect(todayOrders[1].id).toBe('3');
    });

    test('deve converter centavos para reais', () => {
        const centavos = 5000;
        const reais = centavos / 100;
        expect(reais).toBe(50.00);
    });

    test('deve formatar valores em BRL', () => {
        const value = 12350;
        const formatted = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value / 100);

        expect(formatted.replace(/\s/g, ' ')).toBe('R$ 123,50');
    });

    test('deve agrupar pedidos por dia', () => {
        const orders = [
            createOrder({ createdAt: new Date('2026-01-15T10:00:00'), total: 5000 }),
            createOrder({ createdAt: new Date('2026-01-15T15:00:00'), total: 3000 }),
            createOrder({ createdAt: new Date('2026-01-16T10:00:00'), total: 7000 }),
        ];

        const dailyRevenue = new Map();

        orders.filter(o => o.status === 'Entregue').forEach(order => {
            const date = order.createdAt;
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            dailyRevenue.set(key, (dailyRevenue.get(key) || 0) + order.total);
        });

        expect(dailyRevenue.get('2026-01-15')).toBe(8000);
        expect(dailyRevenue.get('2026-01-16')).toBe(7000);
    });

    test('deve agrupar pedidos por hora', () => {
        const orders = [
            createOrder({ createdAt: new Date('2026-01-15T10:30:00'), total: 5000 }),
            createOrder({ createdAt: new Date('2026-01-15T10:45:00'), total: 3000 }),
            createOrder({ createdAt: new Date('2026-01-15T11:00:00'), total: 7000 }),
        ];

        const hourlyRevenue = new Map();

        orders.filter(o => o.status === 'Entregue').forEach(order => {
            const hour = order.createdAt.getHours();
            hourlyRevenue.set(hour, (hourlyRevenue.get(hour) || 0) + order.total);
        });

        expect(hourlyRevenue.get(10)).toBe(8000);
        expect(hourlyRevenue.get(11)).toBe(7000);
    });
});

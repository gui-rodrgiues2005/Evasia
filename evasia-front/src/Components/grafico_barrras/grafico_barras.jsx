import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, Cell } from 'recharts';

const GraficoRisco = ({ quantidade }) => {
    const navigate = useNavigate();

    console.log('Dados recebidos no gráfico:', quantidade);

    const dataRisco = [
        { nivel: 'Alto Risco', alunos: Number(quantidade?.alto) || 0, cor: '#e53935', filtro: 'Alto risco' },
        { nivel: 'Médio Risco', alunos: Number(quantidade?.medio) || 0, cor: '#fbc02d', filtro: 'Médio risco' },
        { nivel: 'Baixo Risco', alunos: Number(quantidade?.baixo) || 0, cor: '#43a047', filtro: 'Baixo risco' }
    ];

    const handleBarClick = (data) => {
        const filtroUrl = encodeURIComponent(data.payload.filtro);
        navigate(`/alunos?filtro=${filtroUrl}`);
        console.log('Navegando para:', data.payload.filtro);
    };

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    background: 'white',
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                }}>
                    <p>{`${payload[0].payload.nivel}: ${payload[0].value} alunos`}</p>
                    <small style={{ color: '#666' }}>Clique para ver detalhes</small>
                </div>
            );
        }
        return null;
    };

    return (
        <div style={{ width: '100%', height: 250, padding: '1rem' }}>
            <h3>Alunos em Risco</h3>
            <p>Distribuição por nível de risco</p>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataRisco} layout="vertical">
                    <XAxis type="number" />
                    <YAxis dataKey="nivel" type="category" width={100} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                        dataKey="alunos"
                        isAnimationActive={false}
                        onClick={handleBarClick}
                    >
                        <LabelList
                            dataKey="alunos"
                            position="right"
                            formatter={(value) => `${value} alunos`}
                        />
                        {dataRisco.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.cor}
                                cursor="pointer"
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default GraficoRisco;
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, Cell, Legend, CartesianGrid } from 'recharts';

const GraficoRisco = ({ quantidade }) => {
    const navigate = useNavigate();

    const dataRisco = [
        { nivel: 'Alto Risco', alunos: Number(quantidade?.alto) || 0, cor: 'url(#altoRiscoGrad)', filtro: 'Alto risco' },
        { nivel: 'Médio Risco', alunos: Number(quantidade?.medio) || 0, cor: 'url(#medioRiscoGrad)', filtro: 'Médio risco' },
        { nivel: 'Baixo Risco', alunos: Number(quantidade?.baixo) || 0, cor: 'url(#baixoRiscoGrad)', filtro: 'Baixo risco' }
    ];

    const handleBarClick = (data) => {
        const filtroUrl = encodeURIComponent(data.payload.filtro);
        navigate(`/alunos?filtro=${filtroUrl}`);
    };

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    width: '100%',
                    height: 300,
                    padding: '1.5rem',
                    background: '#fff',
                    borderRadius: '1.25rem',
                    boxShadow: '0 4px 18px rgba(44,62,80,0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                }}>
                    <strong style={{ color: '#222' }}>{payload[0].payload.nivel}</strong>
                    <div style={{ fontSize: '1.2rem', color: '#3498db', fontWeight: 600 }}>
                        {payload[0].value} alunos
                    </div>
                    <div style={{ color: '#888', fontSize: '0.9rem', marginTop: 4 }}>
                        Clique para ver detalhes
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div style={{
            width: '100%',
            height: 300,
            padding: '1.5rem',
            background: '#fff',
            borderRadius: '1.25rem',
            boxShadow: '0 4px 18px rgba(44,62,80,0.08)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
        }}>
            <h3 style={{
                margin: 0,
                fontWeight: 700,
                fontSize: '1.25rem',
                color: '#2c3e50',
                letterSpacing: 0.5
            }}>
                Alunos em Risco
            </h3>
            <p style={{
                margin: '0 0 1rem 0',
                color: '#888',
                fontSize: '1rem'
            }}>
                Distribuição por nível de risco
            </p>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={dataRisco}
                    layout="vertical"
                    barCategoryGap="30%"
                    margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                >
                    <defs>
                        <linearGradient id="altoRiscoGrad" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#e53935" />
                            <stop offset="100%" stopColor="#ff7675" />
                        </linearGradient>
                        <linearGradient id="medioRiscoGrad" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#fbc02d" />
                            <stop offset="100%" stopColor="#ffe082" />
                        </linearGradient>
                        <linearGradient id="baixoRiscoGrad" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#43a047" />
                            <stop offset="100%" stopColor="#b2ff59" />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis type="number" axisLine={false} tickLine={false} fontSize={13} />
                    <YAxis dataKey="nivel" type="category" width={110} axisLine={false} tickLine={false} fontSize={14} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(52,152,219,0.07)' }} />
                    <Legend
                        verticalAlign="top"
                        align="right"
                        iconType="circle"
                        wrapperStyle={{ fontSize: 13, marginBottom: 8 }}
                    />
                    <Bar
                        dataKey="alunos"
                        radius={[12, 12, 12, 12]}
                        isAnimationActive={true}
                        onClick={handleBarClick}
                        minPointSize={2}
                    >
                        <LabelList
                            dataKey="alunos"
                            position="right"
                            formatter={(value) => value > 0 ? `${value} alunos` : ''}
                            style={{ fontWeight: 600, fontSize: 14, fill: '#222' }}
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
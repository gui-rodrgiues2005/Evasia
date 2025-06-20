import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Legend } from 'recharts';

const data = [
  { dia: 'Segunda', interacoes: 65 },
  { dia: 'Terça', interacoes: 55 },
  { dia: 'Quarta', interacoes: 63 },
  { dia: 'Quinta', interacoes: 70 },
  { dia: 'Sexta', interacoes: 60 },
  { dia: 'Sábado', interacoes: 48 },
  { dia: 'Domingo', interacoes: 32 },
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(255,255,255,0.97)',
        padding: '12px 18px',
        border: '1.5px solid #e0e0e0',
        borderRadius: '10px',
        boxShadow: '0 2px 8px rgba(44,62,80,0.08)',
        fontSize: '1rem'
      }}>
        <strong style={{ color: '#222' }}>{payload[0].payload.dia}</strong>
        <div style={{ fontSize: '1.2rem', color: '#42a5f5', fontWeight: 600 }}>
          {payload[0].value} interações
        </div>
      </div>
    );
  }
  return null;
};

const GraficoAtividade = () => (
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
      Atividade Semanal
    </h3>
    <p style={{
      margin: '0 0 1rem 0',
      color: '#888',
      fontSize: '1rem'
    }}>
      Visualização do número de interações diárias
    </p>
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
        barCategoryGap="30%"
      >
        <defs>
          <linearGradient id="interacaoGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#42a5f5" />
            <stop offset="100%" stopColor="#b3e5fc" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
        <XAxis dataKey="dia" axisLine={false} tickLine={false} fontSize={13} />
        <YAxis axisLine={false} tickLine={false} fontSize={13} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(66,165,245,0.07)' }} />
        <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: 13, marginBottom: 8 }} />
        <Bar
          dataKey="interacoes"
          fill="url(#interacaoGrad)"
          radius={[8, 8, 8, 8]}
          isAnimationActive={true}
          minPointSize={2}
        >
          <LabelList
            dataKey="interacoes"
            position="top"
            formatter={(value) => value > 0 ? `${value}` : ''}
            style={{ fontWeight: 600, fontSize: 14, fill: '#222' }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export default GraficoAtividade;
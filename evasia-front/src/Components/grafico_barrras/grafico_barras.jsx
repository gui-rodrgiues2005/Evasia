import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, Cell } from 'recharts';

const dataRisco = [
  { nivel: 'Alto Risco', alunos: 14, cor: '#e53935' },
  { nivel: 'Risco Médio', alunos: 23, cor: '#fbc02d' },
  { nivel: 'Baixo Risco', alunos: 211, cor: '#43a047' },
];

const GraficoRisco = () => (
  <div style={{ width: '100%', height: 250 }}>
    <h3>Alunos em Risco</h3>
    <p>Distribuição por nível de risco</p>
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={dataRisco} layout="vertical">
        <XAxis type="number" hide />
        <YAxis dataKey="nivel" type="category" width={100} />
        <Tooltip />
        <Bar dataKey="alunos" isAnimationActive={false}>
          <LabelList dataKey="alunos" position="right" />
          {dataRisco.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.cor} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
    <a
      href="#"
      style={{
        display: 'block',
        textAlign: 'center',
        textDecoration: 'none',
        color: '#007bff',
        fontWeight: '500',
        marginTop: '1rem',
        cursor: 'pointer',
        transition: 'color 0.3s'
      }}
      onMouseOver={e => e.currentTarget.style.color = '#0056b3'} // efeito hover manual
      onMouseOut={e => e.currentTarget.style.color = '#007bff'}  // volta ao normal
    >
      Ver todos os alunos
    </a>

  </div>
);

export default GraficoRisco;
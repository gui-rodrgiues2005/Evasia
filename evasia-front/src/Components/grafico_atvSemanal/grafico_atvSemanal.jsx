import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { dia: 'Segunda', interacoes: 65 },
  { dia: 'Terça', interacoes: 55 },
  { dia: 'Quarta', interacoes: 63 },
  { dia: 'Quinta', interacoes: 70 },
  { dia: 'Sexta', interacoes: 60 },
  { dia: 'Sábado', interacoes: 48 },
  { dia: 'Domingo', interacoes: 32 },
];

const GraficoAtividade = () => (
  <div style={{ width: '100%', height: 300 }}>
    <h3>Atividade Semanal</h3>
    <p>Visualização do número de interações diárias</p>
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="dia" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="interacoes" fill="#42a5f5" radius={[5, 5, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export default GraficoAtividade;

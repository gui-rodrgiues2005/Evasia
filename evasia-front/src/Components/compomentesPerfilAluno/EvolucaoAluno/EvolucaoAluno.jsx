import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';
import './EvolucaoAluno.scss';

// Copie esta função para cá
function agruparPorMes(logs) {
  const meses = {};

  logs.forEach(log => {
    const data = new Date(log.date);
    const mesAno = `${data.getFullYear()}-${(data.getMonth() + 1).toString().padStart(2, '0')}`;

    if (!meses[mesAno]) meses[mesAno] = [];
    meses[mesAno].push(log);
  });

  // Transforma em array de objetos para o gráfico
  return Object.entries(meses).map(([mes, logsMes]) => {
    const participacao = Math.min(100, Math.floor(
      logsMes.filter(l => l.action === "viewed").length / 5 * 100 // ajuste o divisor conforme sua regra
    ));
    return {
      mes,
      participacao
      // média: ...
    };
  });
}

const EvolucaoAluno = ({ logs }) => {
  // Gere os dados de evolução
  const dadosEvolucao = agruparPorMes(logs);

  return (
    <div className="evolucao-aluno">
      <h4>Evolução do Aluno</h4>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={dadosEvolucao}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="mes" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="participacao" stroke="#8884d8" name="Participação (%)" />
          {/* <Line type="monotone" dataKey="media" stroke="#82ca9d" name="Média" /> */}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EvolucaoAluno;
import React from 'react';
import './MetricaAluno.scss';

const MetricaAluno = ({ participacao = 95, media = 8.5, conclusao = 92 }) => {
  const mediaPercentual = (media / 10) * 100;

  const metrics = [
    { label: 'Participação', value: participacao, display: `${participacao}%` },
    { label: 'Média Geral', value: mediaPercentual, display: media.toFixed(1) },
    { label: 'Taxa de Conclusão', value: conclusao, display: `${conclusao}%` },
  ];

  return (
    <div className="metricas-aluno">
      {metrics.map((met, i) => (
        <div key={i} className="item">
          <div className="header">
            <span className="label">{met.label}</span>
            <span className="valor">{met.display}</span>
          </div>
          <div className="barra">
            <div className="preenchimento" style={{ width: `${met.value}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default MetricaAluno;

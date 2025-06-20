import React from 'react';
import './MetricaAluno.scss';

const MetricaAluno = ({ participacao, media, conclusao }) => {
  const safeFormat = (value, tipo) => {
    if (value === null || value === undefined || isNaN(value)) return '0';
    if (tipo === 'media') return Number(value).toFixed(1);
    return Math.round(value).toString();
  };

  const metrics = [
    { label: 'Participação', value: participacao, display: `${safeFormat(participacao)}%` },
    { label: 'Média Geral', value: media, display: `${safeFormat(media, 'media')}` },
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
            <div className="preenchimento" style={{ width: `${met.value || 0}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default MetricaAluno;
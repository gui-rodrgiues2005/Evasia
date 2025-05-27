import React from 'react';
import './EvolucaoAluno.scss';

const EvolucaoAluno = () => {
  return (
    <div className="evolucao-aluno">
      <h4>Evolução do Aluno</h4>
      <p className="descricao-grafico">Histórico de desempenho nos últimos meses</p>
      {/* Aqui você pode usar um componente de gráfico real (Recharts, Chart.js etc),
          ou manter esse placeholder para depois integrar */}
      <div className="grafico-placeholder">
        {/* placeholder grid */}
        <div className="grid">
          {['JAN','FEV','MAR','ABR','MAI','JUN','JUL'].map((mês, i) => (
            <div key={i} className="grid-col">
              <div className="linha-verde" />
              <div className="linha-azul" />
              <span className="label">{mês}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="legenda">
        <span className="nota-media">Nota Média</span>
        <span className="participacao">Participação %</span>
      </div>
    </div>
  );
};

export default EvolucaoAluno;

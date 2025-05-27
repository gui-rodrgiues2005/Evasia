import React from 'react';
import './HistoricoAtividades.scss';

const HistoricoAtividades = () => {
  return (
    <div className="historico-atividades">
      <h4>Atividades Recentes</h4>
      <ul>
        <li>
          <span className="data">Ontem</span> — <span className="descricao">👤 Acessou a plataforma</span>
        </li>
        <li>
          <span className="data">3 dias atrás</span> — <span className="descricao">📄 Entregou atividade: “Análise de Mercado”</span>
        </li>
        <li>
          <span className="data">5 dias atrás</span> — <span className="descricao">💬 Participou do fórum: “Tendências em Gestão”</span>
        </li>
      </ul>
    </div>
  );
};

export default HistoricoAtividades;

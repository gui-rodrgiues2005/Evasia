import React from 'react';
import './ResumoStatus.scss';

const ResumoStatus = () => {
  return (
    <div className="resumo-status">
      <ul>
        <li>📌 Atividades Pendentes: <strong>0</strong></li>
        <li>📈 Frequência de Acesso: <strong>Alta (5-7 acessos por semana)</strong></li>
        <li>✅ Status de Retenção: <strong>Engajamento satisfatório</strong></li>
      </ul>
    </div>
  );
};

export default ResumoStatus;

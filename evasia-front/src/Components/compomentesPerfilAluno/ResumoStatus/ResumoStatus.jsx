import React from 'react';
import './ResumoStatus.scss';

const ResumoStatus = ({ atividadesPendentes }) => {
  console.log('atividadesPendentes:', atividadesPendentes);

  return (
    <div className="resumo-status">
      <ul>
        <li>
          📌 Atividades Pendentes: <strong>{atividadesPendentes > 0 ? atividadesPendentes : 'O aluno esta com as atividades em dia !'}</strong>
        </li>
        <li>📈 Frequência de Acesso: <strong>Alta (5-7 acessos por semana)</strong></li>
        <li>✅ Status de Retenção: <strong>Engajamento satisfatório</strong></li>
      </ul>
    </div>
  );
};


export default ResumoStatus;

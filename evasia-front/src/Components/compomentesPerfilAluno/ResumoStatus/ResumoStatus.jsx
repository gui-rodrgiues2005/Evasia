import React from 'react';
import './ResumoStatus.scss';

const ResumoStatus = ({ atividadesPendentes, userLastAccess, risco }) => {
  const diasDesdeUltimoAcesso = userLastAccess
    ? Math.floor((Date.now() - new Date(userLastAccess)) / (1000 * 60 * 60 * 24))
    : null;

  const getFrequenciaTexto = (dias) => {
    if (dias === null) return 'Indisponível';
    if (dias <= 3) return 'Alta (acessou nos últimos 3 dias)';
    if (dias <= 7) return 'Média (acessou na última semana)';
    return 'Baixa (não acessa há mais de uma semana)';
  };

  const interpretarRisco = (risco) => {
    switch (risco) {
      case 'Alto risco': return '🔴 Alto risco de evasão';
      case 'Médio risco': return '🟡 Atenção moderada';
      default: return '🟢 Engajamento satisfatório';
    }
  };

  return (
    <div className="resumo-status">
      <ul>
        <li>
          Atividades Pendentes:{' '}
          <strong>
            {atividadesPendentes > 0
              ? `${atividadesPendentes} atividade(s) não acessada(s)`
              : 'O aluno está com as atividades em dia!'}
          </strong>
        </li>
        <li>
          Frequência de Acesso:{' '}
          <strong>{getFrequenciaTexto(diasDesdeUltimoAcesso)}</strong>
        </li>
        <li className={`status-${(risco || '').replace(' risco', '').toLowerCase()}`}>
          Status de Retenção:{' '}
          <strong>{interpretarRisco(risco)}</strong>
        </li>
      </ul>
    </div>
  );
};

export default ResumoStatus;

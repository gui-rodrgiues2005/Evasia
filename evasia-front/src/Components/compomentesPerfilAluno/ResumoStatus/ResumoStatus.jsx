import React from 'react';
import './ResumoStatus.scss';

const ResumoStatus = ({ atividadesPendentes, userLastAccess, risco }) => {
  const diasDesdeUltimoAcesso = userLastAccess
      ? Math.floor((Date.now() - new Date(userLastAccess)) / (1000 * 60 * 60 * 24))
      : null;

  const frequenciaTexto = diasDesdeUltimoAcesso === null
      ? 'Indisponível'
      : diasDesdeUltimoAcesso <= 3
          ? 'Alta (acessou nos últimos 3 dias)'
          : diasDesdeUltimoAcesso <= 7
              ? 'Média (acessou na última semana)'
              : 'Baixa (mais de 7 dias sem acesso)';

  const statusRetencao = risco === 'Alto'
      ? '⚠️ Alto risco de evasão'
      : risco === 'Médio'
          ? '🔶 Atenção moderada'
          : '✅ Engajamento satisfatório';

  return (
      <div className="resumo-status">
        <ul>
          <li>
            📌 Atividades Pendentes:{' '}
            <strong>
              {atividadesPendentes > 0
                  ? `${atividadesPendentes} atividade(s) não acessada(s)`
                  : 'O aluno está com as atividades em dia!'}
            </strong>
          </li>
          <li>
            📈 Frequência de Acesso:{' '}
            <strong>
              {frequenciaTexto}
              {diasDesdeUltimoAcesso !== null && ` — há ${diasDesdeUltimoAcesso} dias`}
            </strong>
          </li>
          <li>
            ✅ Status de Retenção: <strong>{statusRetencao}</strong>
          </li>
        </ul>
      </div>
  );
};

export default ResumoStatus;

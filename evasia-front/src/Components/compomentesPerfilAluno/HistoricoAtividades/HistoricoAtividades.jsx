import React from 'react';
import './HistoricoAtividades.scss';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const HistoricoAtividades = ({ atividades = [] }) => {
  // Filtra logs que tenham date válido
  const atividadesValidas = atividades.filter(log => log.date);

  const atividadesFormatadas = atividadesValidas
    .slice(0, 6) // limita as 6 mais recentes
    .map((log, index) => {
      const dataFormatada = formatDistanceToNow(parseISO(log.date), { addSuffix: true, locale: ptBR });

      let descricao = '';
      switch (log.target) {
        case 'course':
          descricao = '👤 Acessou o curso';
          break;
        case 'course_module':
          descricao = '📄 Acessou um recurso';
          break;
        case 'discussion':
          descricao = '💬 Participou de um fórum';
          break;
        default:
          descricao = `🔎 Ação: ${log.action}`;
      }

      return (
        <li key={index}>
          <span className="data">{dataFormatada}</span> — <span className="descricao">{descricao}</span>
        </li>
      );
    });

  return (
    <div className="historico-atividades">
      <h4>Atividades Recentes</h4>
      <ul>
        {atividadesFormatadas.length > 0 ? atividadesFormatadas : <li>Sem atividades registradas.</li>}
      </ul>
    </div>
  );
};

export default HistoricoAtividades;

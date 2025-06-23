import React from 'react';
import './Evasao.scss';

const Evasao = ({ risco }) => {
  if (!risco) return null;

  // Normaliza o risco para evitar erro com acentos ou espaços extras
  const riscoNormalizado = risco
    .toLowerCase()
    .normalize("NFD") // Remove acentos
    .replace(/[\u0300-\u036f]/g, '') // Regex que remove marcas de acento
    .trim();

  let corClasse;
  let mensagem;
  let emoji;

  switch (riscoNormalizado) {
    case 'alto risco':
      corClasse = 'alto';
      mensagem = 'Este aluno apresenta ALTO risco de evasão.';
      emoji = '🔴';
      break;
    case 'medio risco':
      corClasse = 'medio';
      mensagem = 'Este aluno requer atenção: risco MÉDIO.';
      emoji = '🟡';
      break;
    default:
      corClasse = 'baixo';
      mensagem = 'Este aluno tem um risco BAIXO de evasão.';
      emoji = '🟢';
  }

  return (
    <div className={`evasao-container ${corClasse}`}>
      <p>{emoji} <strong>{mensagem}</strong></p>
    </div>
  );
};

export default Evasao;

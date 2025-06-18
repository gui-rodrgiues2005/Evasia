import React from 'react';
import './Evasao.scss';

const Evasao = ({ risco }) => {
  let cor;

  switch (risco.toLowerCase()) {
    case 'alto risco':
      cor = 'alto';
      break;
    case 'médio risco':
      cor = 'medio';
      break;
    default:
      cor = 'baixo';
  }

  return (
    <div className={`evasao-container ${cor}`}>
      <p>⚠️Este aluno tem um <strong>{risco}</strong>de evasão</p>
    </div>
  );
};

export default Evasao;

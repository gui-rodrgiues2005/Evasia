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
      <p>⚠️ Risco de evasão: <strong>{risco}</strong></p>
    </div>
  );
};

export default Evasao;

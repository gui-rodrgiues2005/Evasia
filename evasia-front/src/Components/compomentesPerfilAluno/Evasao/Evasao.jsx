import React from 'react';
import './Evasao.scss';

const Evasao = ({ userId }) => {
  let cor;
  switch (risco) {
    case 'alto':
      cor = 'alto';
      break;
    case 'medio':
      cor = 'medio';
      break;
    default:
      cor = 'baixo';
  }

  return (
    <div className={`evasao-container ${cor}`}>
      <p>⚠️ Risco de evasão: <strong>{risco.charAt(0).toUpperCase() + risco.slice(1)}</strong></p>
    </div>
  );
};

export default Evasao;

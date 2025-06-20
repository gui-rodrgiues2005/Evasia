import React from "react";
import './Cards.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const Cards = ({ title, quantidade, icon, porcentagem, informacao, loading }) => {
  return (
    <div className='card'>
      <div className='card-icon'>
        <FontAwesomeIcon icon={icon} />
      </div>
      <div className='card-content'>
        <h3>{title}</h3>
        {loading ? (
          <p className="loading">Carregando...</p>
        ) : (
          <>
            <h2>{quantidade}</h2>
            <p>
              {porcentagem && (
                <span className={`porcentagem ${Number(porcentagem) < 0 ? 'negativo' : ''}`}>
                  {porcentagem}
                </span>
              )}
              {informacao}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Cards;
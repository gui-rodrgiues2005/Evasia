import React from 'react';
import './PerfilHeader.scss';
import perfilImg from '../../../assets/use.svg';

const PerfilHeader = ({ name }) => {
  return (
    <div className="perfil-header">
      <div className="perfil-header__avatar-container">
        <img 
          src={perfilImg} 
          alt="Perfil do aluno" 
          className="perfil-header__image"
        />
      </div>
      <div className="perfil-header__info">
        <h1 className="perfil-header__name">{name}</h1>
        <p className="perfil-header__course">Ciência da Computação</p>
      </div>
    </div>
  );
};

export default PerfilHeader;

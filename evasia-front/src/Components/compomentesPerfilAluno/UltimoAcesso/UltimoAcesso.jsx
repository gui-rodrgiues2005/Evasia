import React from 'react';
import './UltimoAcesso.scss';

const UltimoAcesso = ({ userLastAccess }) => {
  let mensagem = 'Sem registros de acesso.';
  let alerta = false;
  
  if (userLastAccess) {
    const dias = Math.floor((Date.now() - new Date(userLastAccess)) / (1000 * 60 * 60 * 24));
    
    if (dias === 0) {
      mensagem = 'O aluno acessou o Moodle hoje.';
    } else {
      mensagem = `O aluno está há ${dias} dia${dias > 1 ? 's' : ''} sem entrar no Moodle.`;
      alerta = dias > 7;
    }
  }

  return (
    <div className="ultimo-acesso">
      <h4>Último Acesso</h4>
      <p className={alerta ? 'alerta' : ''}>{mensagem}</p>
    </div>
  );
};

export default UltimoAcesso;
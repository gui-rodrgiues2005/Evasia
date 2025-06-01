import React, { useEffect, useState } from 'react';
import './Evasao.scss';
import axios from 'axios';

const Evasao = ({ userId }) => {
  const [risco, setRisco] = useState('baixo');

  useEffect(() => {
    if (!userId) return;

    axios.get(`http://localhost:5164/api/LogsUsuario/logs/${userId}`)
      .then(response => {
        const logs = response.data;
        const riscoCalculado = calcularRisco(logs);
        setRisco(riscoCalculado);
      })
      .catch(error => {
        console.error('Erro ao buscar os logs do aluno:', error);
      });
  }, [userId]);

  const calcularRisco = (logs) => {
    if (!logs || logs.length === 0) return 'alto';

    const ultimoAcesso = new Date(logs[0].user_lastaccess);
    const agora = new Date();
    const diasSemAcesso = Math.floor((agora - ultimoAcesso) / (1000 * 60 * 60 * 24));

    if (diasSemAcesso > 10) return 'alto';
    if (diasSemAcesso > 5) return 'medio';
    return 'baixo';
  };

  return (
    <div className={`evasao-container ${risco}`}>
      <p>⚠️ Risco de evasão: <strong>{risco.charAt(0).toUpperCase() + risco.slice(1)}</strong></p>
    </div>
  );
};

export default Evasao;

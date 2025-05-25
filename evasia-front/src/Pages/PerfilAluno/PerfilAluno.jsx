import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

const PerfilAluno = () => {
  const { user_id } = useParams();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Variáveis para exibir dados fixos, baseados no primeiro log, já que todos têm o mesmo user_id e name
  const alunoNome = logs.length > 0 ? logs[0].name : '';
  const lastAccess = logs.length > 0 ? logs[0].user_lastaccess : '';

  useEffect(() => {
    fetch(`http://localhost:5164/api/LogsUsuario/logs?userId=${user_id}`)
      .then(res => {
        if (!res.ok) throw new Error('Erro ao carregar dados');
        return res.json();
      })
      .then(data => {
        setLogs(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [user_id]);

  if (loading) return <div>Carregando dados do aluno...</div>;
  if (error) return <div>Erro: {error}</div>;
  if (logs.length === 0) return <div>Aluno não encontrado ou sem registros</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <div style={{ marginBottom: '10px' }}>
        <Link to="/alunos" style={{ textDecoration: 'none', color: '#007bff', fontWeight: 'bold' }}>
          ← Voltar para a lista de alunos
        </Link>
      </div>

      <h3>{alunoNome}</h3>
      <p>Último acesso: {new Date(lastAccess).toLocaleString()}</p>

      {/* Exemplo simples de exibição das atividades (logs) */}
      <div style={{ marginTop: '20px' }}>
        <h4>Atividades Recentes</h4>
        <ul>
          {logs.map((log, index) => (
            <li key={index} style={{ marginBottom: '10px' }}>
              <strong>{new Date(log.date).toLocaleString()}</strong> — {log.action} {log.target} ({log.component})<br />
              Curso: {log.course_fullname}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default PerfilAluno;

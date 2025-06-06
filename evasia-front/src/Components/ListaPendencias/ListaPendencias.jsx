import React from 'react';
import { Link } from 'react-router-dom';

const ListaPendencias = ({ pendencias }) => {
  console.log('ListaPendencias', pendencias);

  return (
    <div style={{
      backgroundColor: '#fff',
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '1rem',
      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
    }}>
      <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Pendências Recentes</h3>

      {pendencias.map((aluno, index) => (
        <div key={index} style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.75rem 0',
          borderBottom: index < pendencias.length - 1 ? '1px solid #eee' : 'none',
        }}>
          <div>
            <strong>Aluno(a) {aluno.nome}</strong> tem {aluno.qtdPendencias} atividades não entregues
            <div style={{ fontSize: '0.85rem', color: '#888' }}>{aluno.data}</div>
          </div>
          <Link
            to={`/perfil-aluno/${aluno.id}`}
            style={{
              textDecoration: 'none',
              color: '#007bff',
              fontSize: '0.9rem',
            }}
            onMouseOver={e => e.currentTarget.style.color = '#0056b3'}
            onMouseOut={e => e.currentTarget.style.color = '#007bff'}
          >
            Ver detalhes
          </Link>

        </div>
      ))}
    </div>
  );
};

export default ListaPendencias;

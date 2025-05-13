import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Alunos = () => {
  const [filtro, setFiltro] = useState('Todos');
  const [busca, setBusca] = useState('');

  const alunosMock = [
    {
      nome: 'Ana Silva',
      email: 'ana@gmail.com',
      curso: 'Administração',
      ultimoAcesso: '2 dias atrás',
      participacao: 60,
      media: 8.5,
      pendentes: 0,
      risco: 'Baixo'
    },
    {
      nome: 'Carlos Souza',
      email: 'carlos@gmail.com',
      curso: 'Direito',
      ultimoAcesso: '5 dias atrás',
      participacao: 35,
      media: 6.5,
      pendentes: 3,
      risco: 'Alto'
    },
    {
      nome: 'Maria Oliveira',
      email: 'maria@gmail.com',
      curso: 'Pedagogia',
      ultimoAcesso: '3 dias atrás',
      participacao: 50,
      media: 7.2,
      pendentes: 1,
      risco: 'Médio'
    },
  ];

  const riscoCor = {
    'Alto': 'red',
    'Médio': '#f5a623',
    'Baixo': 'green'
  };

  const alunosFiltrados = alunosMock.filter(aluno => {
    const matchBusca = aluno.nome.toLowerCase().includes(busca.toLowerCase());
    const matchFiltro = filtro === 'Todos' || aluno.risco === filtro;
    return matchBusca && matchFiltro;
  });

  return (
    <div style={{ padding: '1rem' }}>
      <h2 style={{ marginBottom: '1rem' }}>Alunos</h2>

      {/* Campo de busca */}
      <input
        type="text"
        placeholder="Buscar alunos..."
        value={busca}
        onChange={e => setBusca(e.target.value)}
        style={{
          padding: '0.5rem',
          width: '300px',
          marginBottom: '1rem',
          border: '1px solid #ccc',
          borderRadius: '6px'
        }}
      />

      {/* Filtros */}
      <div style={{ marginBottom: '1rem' }}>
        {['Todos', 'Alto', 'Médio', 'Baixo'].map(item => (
          <button
            key={item}
            onClick={() => setFiltro(item)}
            style={{
              marginRight: '0.5rem',
              backgroundColor: filtro === item ? '#dceeff' : '#f1f1f1',
              border: '1px solid #ccc',
              borderRadius: '6px',
              padding: '0.4rem 1rem',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {item === 'Alto' ? 'Alto Risco' :
              item === 'Médio' ? 'Médio Risco' :
                item === 'Baixo' ? 'Baixo Risco' : 'Todos'}
          </button>
        ))}
      </div>

      {/* Tabela */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
        <thead>
          <tr style={{ background: '#f9f9f9' }}>
            <th style={thStyle}>Aluno</th>
            <th style={thStyle}>Curso</th>
            <th style={thStyle}>Último acesso</th>
            <th style={thStyle}>Participação</th>
            <th style={thStyle}>Média</th>
            <th style={thStyle}>Pendentes</th>
            <th style={thStyle}>Risco</th>
            <th style={thStyle}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {alunosFiltrados.map((aluno, index) => (
            <tr key={index} style={{ borderBottom: '1px solid #ddd' }}>
              <td style={tdStyle}>
                <strong>{aluno.nome}</strong><br />
                <small>{aluno.email}</small>
              </td>
              <td style={tdStyle}>{aluno.curso}</td>
              <td style={tdStyle}>{aluno.ultimoAcesso}</td>
              <td style={tdStyle}>
                <div style={{ width: '100px', background: '#eee', borderRadius: '4px' }}>
                  <div style={{
                    width: `${aluno.participacao}%`,
                    background: '#333',
                    height: '8px',
                    borderRadius: '4px'
                  }}></div>
                </div>
                <small>{aluno.participacao}%</small>
              </td>
              <td style={tdStyle}>{aluno.media}</td>
              <td style={{ ...tdStyle, textAlign: 'center' }}>
                <span style={{
                  background: '#e0f7e0',
                  padding: '2px 8px',
                  borderRadius: '8px',
                  fontSize: '0.8rem'
                }}>{aluno.pendentes}</span>
              </td>
              <td style={tdStyle}>
                <span style={{
                  backgroundColor: riscoCor[aluno.risco],
                  color: '#fff',
                  padding: '2px 8px',
                  borderRadius: '8px',
                  fontSize: '0.8rem'
                }}>{aluno.risco}</span>
              </td>
              <td style={tdStyle}>
                <button style={{
                  background: '#eee',
                  border: '1px solid #ccc',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  cursor: 'pointer'
                }}>
                  <Link
                    to={`/alunos/${aluno.id}`}
                    style={{
                      textDecoration: 'none',
                      color: 'black',
                      cursor: 'pointer', 
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontWeight: 'bold'
                    }}
                  >
                    Ver
                  </Link>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const thStyle = {
  textAlign: 'left',
  padding: '0.5rem',
  borderBottom: '2px solid #ccc'
};

const tdStyle = {
  padding: '0.5rem',
  verticalAlign: 'middle'
};

export default Alunos;

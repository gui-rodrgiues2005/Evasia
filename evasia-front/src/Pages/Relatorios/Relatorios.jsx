import React, { useState } from 'react';

const relatoriosMock = [
  {
    id: 1,
    titulo: 'Relatório de Evasão – 2025',
    data: '12/04/2025',
    icone: '📄'
  },
  {
    id: 2,
    titulo: 'Monitoramento de Alunos em Riscos',
    data: '12/04/2025',
    icone: '📊'
  }
];

const dadosDetalheMock = {
  id: 2,
  colunas: ['Nome', 'Curso', 'Risco(%)', 'Último Acesso', 'Ações'],
  linhas: [
    {
      nome: 'Marcos Pereira',
      curso: 'Engenharia de Software',
      risco: 85,
      ultimoAcesso: '18 dias atrás'
    }
  ]
};

const Relatorios = () => {
  const [selecionado, setSelecionado] = useState(relatoriosMock[1]);
  const [busca, setBusca] = useState('');

  const relsFiltrados = relatoriosMock.filter(r =>
    r.titulo.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div style={{ padding: '24px', fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ marginBottom: '16px' }}>Relatórios</h2>

      {/* Top Metrics */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <div style={cardMetricStyle}>
          <strong>Total de relatórios</strong>
          <p style={{ margin: '4px 0', fontSize: '1.5rem' }}>8</p>
          <small>Atualizados diariamente</small>
        </div>
        <div style={cardMetricStyle}>
          <strong>Alunos em Risco</strong>
          <p style={{ margin: '4px 0', fontSize: '1.5rem' }}>5</p>
          <small>Encontrados no sistema</small>
        </div>
        <div style={cardMetricStyle}>
          <strong>Último Atualizado</strong>
          <p style={{ margin: '4px 0', fontSize: '1.5rem' }}>14/04/2025</p>
          <small>Atualização em 24 horas</small>
        </div>
        <button style={exportButtonStyle}>Exportar</button>
      </div>

      <div style={{ display: 'flex', gap: '16px' }}>
        {/* Lista de Relatórios */}
        <div style={sidebarStyle}>
          <input
            type="text"
            placeholder="Buscar relatórios..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            style={searchStyle}
          />
          <ul style={listStyle}>
            {relsFiltrados.map(r => (
              <li
                key={r.id}
                onClick={() => setSelecionado(r)}
                style={{
                  ...listItemStyle,
                  background: selecionado.id === r.id ? '#e6f0ff' : 'transparent'
                }}
              >
                <span style={{ fontSize: '1.2rem', marginRight: '8px' }}>{r.icone}</span>
                <div>
                  <div>{r.titulo}</div>
                  <small style={{ color: '#666' }}>{r.data}</small>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Detalhes do Relatório */}
        <div style={detailStyle}>
          <h3 style={{ marginTop: 0 }}>{selecionado.titulo}</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f9f9f9' }}>
              <tr>
                {dadosDetalheMock.colunas.map(col => (
                  <th key={col} style={thStyle}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dadosDetalheMock.linhas.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={tdStyle}>{row.nome}</td>
                  <td style={tdStyle}>{row.curso}</td>
                  <td style={tdStyle}>
                    <div style={{
                      width: '80px',
                      background: '#ddd',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      display: 'inline-block',
                      marginRight: '4px'
                    }}>
                      <div style={{
                        width: `${row.risco}%`,
                        background: '#e53935',
                        height: '10px'
                      }} />
                    </div>
                    <span>{row.risco}%</span>
                  </td>
                  <td style={tdStyle}>{row.ultimoAcesso}</td>
                  <td style={tdStyle}>
                    <a
                      href="#"
                      style={{
                        textDecoration: 'none',
                        color: '#007bff',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      Ver Perfil
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Styles
const cardMetricStyle = {
  background: '#fff',
  border: '1px solid #ddd',
  borderRadius: '8px',
  padding: '16px',
  flex: '1'
};

const exportButtonStyle = {
  background: '#000',
  color: '#fff',
  border: 'none',
  padding: '0 16px',
  fontWeight: 'bold',
  borderRadius: '4px',
  cursor: 'pointer'
};

const sidebarStyle = {
  width: '250px',
  background: '#fff',
  border: '1px solid #ddd',
  borderRadius: '8px',
  padding: '16px',
  height: 'fit-content'
};

const searchStyle = {
  width: '100%',
  padding: '8px',
  marginBottom: '16px',
  border: '1px solid #ccc',
  borderRadius: '4px'
};

const listStyle = {
  listStyle: 'none',
  padding: 0,
  margin: 0
};

const listItemStyle = {
  display: 'flex',
  alignItems: 'center',
  padding: '8px',
  borderRadius: '4px',
  cursor: 'pointer',
  marginBottom: '8px'
};

const detailStyle = {
  flex: 1,
  background: '#fff',
  border: '1px solid #ddd',
  borderRadius: '8px',
  padding: '16px'
};

const thStyle = {
  textAlign: 'left',
  padding: '12px',
  borderBottom: '1px solid #ddd'
};

const tdStyle = {
  padding: '12px',
  verticalAlign: 'middle'
};

export default Relatorios;

import React from 'react';

const alunos = [
  { nome: 'João Silva', frequencia: 45, media: 5.2, risco: 'Moderado' },
  { nome: 'João Silva', frequencia: 45, media: 5.2, risco: 'Moderado' },
];

const AlertaEvasao = () => {
  return (
    <div style={{ padding: '24px' }}>
      <h2 style={{ fontSize: '22px', marginBottom: '8px' }}>
        ⚠️ Alertas de Evasão
      </h2>
      <p style={{ marginBottom: '24px' }}>
        Alunos identificados com riscos moderado ou alto de evasão.
      </p>

      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        border: '1px solid #ddd',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <thead style={{ background: '#f9f9f9' }}>
          <tr>
            <th style={thStyle}>Aluno</th>
            <th style={thStyle}>Frequência</th>
            <th style={thStyle}>Média</th>
            <th style={thStyle}>Nível de Risco</th>
          </tr>
        </thead>
        <tbody>
          {alunos.map((aluno, index) => (
            <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
              <td style={tdStyle}>{aluno.nome}</td>
              <td style={tdStyle}>
                <div style={{ width: '100px', background: '#ddd', borderRadius: '4px', overflow: 'hidden', height: '10px', marginBottom: '4px' }}>
                  <div
                    style={{
                      width: `${aluno.frequencia}%`,
                      backgroundColor: '#d4a600',
                      height: '100%'
                    }}
                  />
                </div>
                <span>{aluno.frequencia}%</span>
              </td>
              <td style={tdStyle}>{aluno.media}</td>
              <td style={tdStyle}>
                <span style={{
                  backgroundColor: '#000',
                  color: 'white',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {aluno.risco}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const thStyle = {
  padding: '12px',
  textAlign: 'left',
  fontWeight: 'bold',
  borderBottom: '1px solid #ddd'
};

const tdStyle = {
  padding: '12px',
  textAlign: 'left'
};

export default AlertaEvasao;

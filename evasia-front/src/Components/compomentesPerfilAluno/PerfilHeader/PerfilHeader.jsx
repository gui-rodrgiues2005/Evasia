import React from 'react';
import './PerfilHeader.scss';

const PerfilHeader = () => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
      <div style={{ width: '60px', height: '60px', background: '#ccc', borderRadius: '50%', marginRight: '10px' }} />
      <div>
        <h3 style={{ margin: 0 }}>Ana Silva</h3>
        <p style={{ margin: 0 }}>Administração 3º Semestre</p>
        <span style={{ backgroundColor: '#d4edda', color: '#155724', padding: '2px 8px', borderRadius: '4px' }}>
          Baixo Risco (15%)
        </span>
      </div>
    </div>
  );
};

export default PerfilHeader

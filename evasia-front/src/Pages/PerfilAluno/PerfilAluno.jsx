import React from 'react';
import { Link } from 'react-router-dom';
import PerfilHeader from '../../Components/compomentesPerfilAluno/PerfilHeader/PerfilHeader';
import MetricasAluno from '../../Components/compomentesPerfilAluno/MetricaAluno/MetricaAluno';
import ResumoStatus from '../../Components/compomentesPerfilAluno/ResumoStatus/ResumoStatus';
import HistoricoAtividades from '../../Components/compomentesPerfilAluno/HistoricoAtividades/HistoricoAtividades';
import EvolucaoAluno from '../../Components/compomentesPerfilAluno/EvolucaoAluno/EvolucaoAluno';
import AnaliseTendencia from '../../Components/compomentesPerfilAluno/AnaliseTendencia/AnaliseTendencia';

const PerfilAluno = () => {
  return (
    <div className="perfil-container" style={{ padding: '20px', fontFamily: 'Arial' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link to="/alunos" style={{ textDecoration: 'none', color: '#007bff', fontWeight: 'bold' }}>
          ← Voltar para a lista de alunos
        </Link>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Coluna da Esquerda */}
        <div style={{ flex: 2 }}>
          <PerfilHeader />
          <MetricasAluno />
          <ResumoStatus />
          <HistoricoAtividades />
        </div>

        {/* Coluna da Direita */}
        <div style={{ flex: 1 }}>
          <EvolucaoAluno />
          <AnaliseTendencia />
        </div>
      </div>
    </div>
  );
};

export default PerfilAluno;

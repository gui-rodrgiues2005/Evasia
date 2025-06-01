import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import PerfilHeader from '../../Components/compomentesPerfilAluno/PerfilHeader/PerfilHeader';
import MetricasAluno from '../../Components/compomentesPerfilAluno/MetricaAluno/MetricaAluno';
import ResumoStatus from '../../Components/compomentesPerfilAluno/ResumoStatus/ResumoStatus';
import HistoricoAtividades from '../../Components/compomentesPerfilAluno/HistoricoAtividades/HistoricoAtividades';
import EvolucaoAluno from '../../Components/compomentesPerfilAluno/EvolucaoAluno/EvolucaoAluno';
import AnaliseTendencia from '../../Components/compomentesPerfilAluno/AnaliseTendencia/AnaliseTendencia';
import Evasao from '../../Components/compomentesPerfilAluno/Evasao/Evasao';

const PerfilAluno = () => {

  const [logsAluno, setLogsAluno] = useState([]);
  const { user_id } = useParams();

  useEffect(() => {
    axios.post('http://localhost:5164/api/LogsUsuario/logs', { userId: user_id })
      .then(response => {
        setLogsAluno(response.data);
      })
      .catch(error => {
        console.error('Erro ao buscar os logs do aluno:', error);
      });
  }, []);

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
          <Evasao />
          <HistoricoAtividades />
        </div>

        {/* Coluna da Direita */}
        <div style={{ flex: 1 }}>
          <EvolucaoAluno />
          <AnaliseTendencia logs={logsAluno} />
        </div>
      </div>
    </div>
  );
};

export default PerfilAluno;

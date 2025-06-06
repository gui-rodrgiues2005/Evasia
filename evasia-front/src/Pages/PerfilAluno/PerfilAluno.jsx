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
  const [name, setName] = useState('');
  const [materia, setMateria] = useState('');
  const [participacao, setParticipacao] = useState(0);
  const [atividadesPendentes, setAtividadesPendentes] = useState(0);
  const [media, setMedia] = useState(null);
  const [conclusao, setConclusao] = useState(0);
  const { user_id } = useParams();

  useEffect(() => {
    axios
      .post(`http://localhost:5164/api/LogsUsuario/logs`, `"${user_id}"`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .then((response) => {
        const logs = response.data;
        setLogsAluno(logs);
        setParticipacao(calcularParticipacao(logs));
        setConclusao(calcularConclusao(logs));
        setMedia(calcularMedia(logs));
        setAtividadesPendentes(calcularAtividadesPendentes(logs));

        if (logs.length > 0) {
          setName(logs[0].name);
          setMateria(logs[0].course_fullname);
        }
      })
      .catch((error) => {
        console.error('Erro ao buscar os logs do aluno:', error);
      });
  }, [user_id]);

  function calcularParticipacao(logs) {
    const totalEventos = logs.length;
    const eventosVisualizacao = logs.filter(l => l.action === 'viewed').length;
    const eventosAvaliacao = logs.filter(l => l.action === 'graded').length;
    const participacao = (eventosVisualizacao * 0.5) + (eventosAvaliacao * 1.5);

    return participacao / totalEventos;
  }

  function calcularRisco(logs) {
    const lastAccess = new Date(logs[0].user_lastaccess);
    const hoje = new Date();
    const diffDias = (hoje - lastAccess) / (1000 * 60 * 60 * 24);

    if (diffDias > 30) {
      return 'Alto risco';
    } else if (diffDias > 7) {
      return 'Médio risco';
    } else {
      return 'Baixo risco';
    }
  }

  function calcularConclusao(logs) {
    const modulosTotais = logs.filter(l => l.target === 'course_module');
    const modulosAcessados = modulosTotais.filter(l => l.action === 'viewed');

    console.log("Módulos totais:", modulosTotais);
    console.log("Módulos acessados:", modulosAcessados);

    const total = modulosTotais.length;
    const acessados = modulosAcessados.length;

    if (total === 0) return 0;

    return (acessados / total) * 100;
  }

  function calcularMedia(logs) {
    const avaliacoes = logs.filter(l => l.action === 'graded');
    if (avaliacoes.length === 0) return 0;
    const somaNotasFicticias = avaliacoes.length * 100;
    const media = somaNotasFicticias / avaliacoes.length;
    return media;
  }

  function calcularAtividadesPendentes(logs) {
    const modulosTotais = logs.filter(l => l.target === 'course_module');
    const modulosAcessados = modulosTotais.filter(l => l.action === 'viewed');
    const pendentes = modulosTotais.length - modulosAcessados.length;
    return pendentes > 0 ? pendentes : 0;
  }

  return (
    <div className="perfil-container" style={{ padding: '20px', fontFamily: 'Arial' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link
          to="/alunos"
          style={{ textDecoration: 'none', color: '#007bff', fontWeight: 'bold' }}
        >
          ← Voltar para a lista de alunos
        </Link>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Coluna da Esquerda */}
        <div style={{ flex: 2 }}>
          <PerfilHeader name={name} materia={materia} />
          <MetricasAluno participacao={participacao} media={media} conclusao={conclusao} />
          <ResumoStatus atividadesPendentes={atividadesPendentes}/>
          {logsAluno.length > 0 && <Evasao risco={calcularRisco(logsAluno)} />}
          <HistoricoAtividades atividades={logsAluno} atividadesPendentes={atividadesPendentes} />

        </div>

        {/* Coluna da Direita */}
        <div style={{ flex: 1 }}>
          <EvolucaoAluno user_id={user_id} />
          <AnaliseTendencia logs={logsAluno} />
        </div>
      </div>
    </div>
  );
};

export default PerfilAluno;

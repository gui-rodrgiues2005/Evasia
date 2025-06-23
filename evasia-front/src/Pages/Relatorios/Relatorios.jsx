import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Chart as ChartJS } from 'chart.js/auto';
import { Bar, Doughnut } from 'react-chartjs-2';
import Spiner from '../../Components/Spiner/Spiner';
import './Relatorios.scss';

const totalEsperado = 50;
const acoesValidas = [
  'viewed', 'uploaded', 'submitted', 'created', 'posted', 'graded', 'attempted',
  'completed', 'answered', 'reviewed', 'started'
];
const targetsValidos = [
  'course', 'course_module', 'user', 'user_list', 'user_profile', 'grade_report',
  'user_report', 'report', 'discussion', 'discussion_subscription', 'assessable',
  'post', 'badge_listing', 'activity_report', 'attempt', 'attempt_preview', 'attempt_summary'
];

function normalizarNome(nome) {
  return nome?.toString().trim().toLowerCase().replace(/\s+/g, '');
}

// Participação: considera vários targets (igual Alunos.jsx)
function calcularParticipacao(logs) {
  if (!logs || logs.length === 0) return 0;
  const interacoes = logs.filter(log => log.action === "viewed" && targetsValidos.includes(log.target));
  return Math.min(100, Math.floor((interacoes.length / totalEsperado) * 100));
}

// Progresso no Moodle (cobertura): só course_module
function calcularCoberturaDeModulos(logs) {
  if (!logs || logs.length === 0) return 0;

  // Agora considera todas as ações válidas, independente do target
  const acoes = logs
    .filter(log => acoesValidas.includes(log.action))
    .map(log => `${normalizarNome(log.name)}|${log.component}|${log.target}`);

  const acoesUnicas = [...new Set(acoes)];
  const totalFeito = acoesUnicas.length;

  return Math.min(100, Math.round((totalFeito / totalEsperado) * 100));
}
// Média baseada na participação (igual Alunos.jsx)
function calcularNota(logs) {
  if (!logs || logs.length === 0) return 0;

  const interacoes = logs.filter(log => log.action === "viewed" && targetsValidos.includes(log.target));
  const participacao = Math.min(100, Math.floor((interacoes.length / totalEsperado) * 100));

  const totalLogsNorm = Math.min(logs.length, 100);
  const interacoesNorm = Math.min(interacoes.length * 10, 100);
  const participacaoNorm = participacao;

  const pesoLogs = 1;
  const pesoInteracoes = 2;
  const pesoParticipacao = 3;
  const somaPesos = pesoLogs + pesoInteracoes + pesoParticipacao;

  const nota = (
    (totalLogsNorm * pesoLogs) +
    (interacoesNorm * pesoInteracoes) +
    (participacaoNorm * pesoParticipacao)
  ) / somaPesos;

  return nota / 10; // Para ficar de 0 a 10
}

// Risco igual ao Alunos.jsx
const calcularRisco = (aluno, participacao = 0, media = 10) => {
  const hoje = new Date();
  if (!aluno.user_lastaccess) return 'Alto risco';

  const dataUltimoAcesso = new Date(aluno.user_lastaccess);
  const diffDias = (hoje - dataUltimoAcesso) / (1000 * 60 * 60 * 24);

  if (participacao < 40 && media < 6) return 'Alto risco';
  if (participacao < 40 || media < 6) return 'Alto risco';
  if (participacao >= 50 && diffDias <= 15 && media >= 6) return 'Baixo risco';
  if (participacao < 60 || diffDias > 15 || media < 6.5) return 'Médio risco';
  return 'Baixo risco';
};

const Relatorios = () => {
  const [relatorios, setRelatorios] = useState([]);
  const [selecionado, setSelecionado] = useState(null);
  const [busca, setBusca] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [alunosValidos, setAlunosValidos] = useState([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [dadosCarregados, setDadosCarregados] = useState(false);
  const [dadosProcessados, setDadosProcessados] = useState(false);
  const navigate = useNavigate();
  const [estatisticas, setEstatisticas] = useState({
    totalAlunos: 0,
    alunosRisco: 0,
    mediaEngajamento: 0,
    distribuicaoRisco: {
      alto: 0,
      medio: 0,
      baixo: 0
    }
  });

  // Buscar usuários
  useEffect(() => {
    const buscarUsuarios = async () => {
      if (dadosCarregados) return;

      try {
        setLoadingUsuarios(true);
        const res = await fetch('http://localhost:5164/api/User');
        const data = await res.json();

        const alunosFiltrados = data.filter(u => {
          const nome = u.name?.trim();
          const partesNome = nome?.split(/\s+/) || [];
          const nomeValido = partesNome.length >= 3;
          const soLetras = partesNome.every(parte => /^[A-Za-zÀ-ÿ]+$/.test(parte));
          return nomeValido && soLetras && !u.user_id.startsWith('USER_');
        });

        setAlunosValidos(alunosFiltrados);
      } catch (err) {
        console.error('Erro ao buscar usuários:', err);
      } finally {
        setLoadingUsuarios(false);
      }
    };

    buscarUsuarios();
  }, []);

  // Buscar logs
  useEffect(() => {
    const buscarLogs = async () => {
      if (!alunosValidos.length || dadosCarregados || loadingUsuarios) return;

      try {
        setLoadingLogs(true);

        // Envia todos os IDs em uma única requisição
        const userIds = alunosValidos.map(aluno => aluno.user_id);

        const response = await fetch('http://localhost:5164/api/LogsUsuario/logs-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userIds)
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const resultados = await response.json();

        // Processa os dados dos alunos
        const alunosAtualizados = alunosValidos.map(aluno => {
          const userLogs = resultados.find(r => r.userId === aluno.user_id)?.logs ?? [];
          const participacao = calcularParticipacao(userLogs);
          const cobertura = calcularCoberturaDeModulos(userLogs);
          const media = calcularNota(userLogs).toFixed(1);
          const risco = calcularRisco(aluno, participacao, parseFloat(media));

          return {
            ...aluno,
            participacao,
            cobertura,
            media,
            risco,
            logs: userLogs
          };
        });

        // Atualiza os estados
        setAlunosValidos(alunosAtualizados);
        calcularEstatisticas(alunosAtualizados);
        setDadosCarregados(true);

      } catch (err) {
        console.error('Erro ao buscar logs:', err);
      } finally {
        setLoadingLogs(false);
        setDadosProcessados(true);
      }
    };

    buscarLogs();
  }, [alunosValidos.length, dadosCarregados, loadingUsuarios]);

  // Estatísticas
  const calcularEstatisticas = (alunos) => {
    const stats = alunos.reduce((acc, aluno) => {
      if (aluno.risco === 'Alto risco') acc.distribuicaoRisco.alto++;
      else if (aluno.risco === 'Médio risco') acc.distribuicaoRisco.medio++;
      else if (aluno.risco === 'Baixo risco') acc.distribuicaoRisco.baixo++;
      acc.mediaEngajamento += Number(aluno.participacao || 0);
      return acc;
    }, {
      totalAlunos: alunos.length,
      alunosRisco: 0,
      mediaEngajamento: 0,
      distribuicaoRisco: { alto: 0, medio: 0, baixo: 0 }
    });

    if (alunos.length > 0) {
      stats.mediaEngajamento = Math.round(stats.mediaEngajamento / alunos.length);
    }
    stats.alunosRisco = stats.distribuicaoRisco.alto + stats.distribuicaoRisco.medio;
    setEstatisticas(stats);
  };

  if (loadingUsuarios) {
    return <div className='spiner'><Spiner /> Buscando usuários...</div>;
  }

  const exportarExcel = () => {
    if (!selecionado) {
      alert('Selecione um relatório para exportar');
      return;
    }

    const ws = XLSX.utils.json_to_sheet(selecionado.dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatório");

    // Gerar arquivo Excel
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    saveAs(dataBlob, `relatorio-evasao-${new Date().toISOString()}.xlsx`);
  };

  const handleGerarRelatorio = () => {
    if (!Array.isArray(alunosValidos) || alunosValidos.length === 0) {
      alert('Não há alunos disponíveis para gerar o relatório');
      return;
    }
    gerarRelatorio();
  };

  // Função para gerar relatório
  const gerarRelatorio = () => {
    if (!alunosValidos.length) return;
    setIsGenerating(true);

    try {
      const dadosRelatorio = alunosValidos.map(aluno => {
        const participacao = calcularParticipacao(aluno.logs || []);
        const cobertura = calcularCoberturaDeModulos(aluno.logs || []);
        const media = calcularNota(aluno.logs || []).toFixed(1);
        const risco = calcularRisco(aluno, participacao, parseFloat(media));

        return {
          nome: aluno.fullname || aluno.name,
          curso: 'Ciência da Computação',
          nivelRisco: risco,
          porcentagemRisco: risco === 'Alto risco' ? 100 : risco === 'Médio risco' ? 50 : 25,
          ultimoAcesso: aluno.user_lastaccess,
          participacao,
          media,
          cobertura,
          userId: aluno.user_id,
          logs: aluno.logs
        };
      });

      // Calcula médias gerais
      const mediaEngajamentoRelatorio = Math.round(
        dadosRelatorio.reduce((sum, aluno) => sum + aluno.participacao, 0) / dadosRelatorio.length
      );

      const mediaNotasRelatorio = (
        dadosRelatorio.reduce((sum, aluno) => sum + parseFloat(aluno.media), 0) /
        dadosRelatorio.length
      ).toFixed(1);

      const novoRelatorio = {
        id: Date.now(),
        titulo: `Relatório de Evasão – ${new Date().toLocaleDateString('pt-BR')}`,
        data: new Date().toLocaleDateString('pt-BR'),
        icone: '📊',
        dados: dadosRelatorio,
        estatisticas: {
          totalAlunos: dadosRelatorio.length,
          mediaEngajamento: mediaEngajamentoRelatorio,
          mediaNotas: mediaNotasRelatorio,
          distribuicaoRisco: estatisticas.distribuicaoRisco,
          alunosRisco: estatisticas.alunosRisco,
          dataGeracao: new Date().toLocaleDateString('pt-BR'),

          detalhes: {
            alunoMaiorEngajamento: dadosRelatorio.reduce((max, aluno) =>
              aluno.participacao > (max?.participacao || 0) ? aluno : max, null),
            alunoMenorEngajamento: dadosRelatorio.reduce((min, aluno) =>
              aluno.participacao < (min?.participacao || 100) ? aluno : min, null)
          }
        }
      };

      setRelatorios(prev => [...prev, novoRelatorio]);
      setSelecionado(novoRelatorio);

    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      alert('Erro ao gerar relatório. Verifique o console para mais detalhes.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Componente de gráfico para distribuição de risco
  const GraficoDistribuicao = ({ data }) => {
    const chartData = {
      labels: ['Alto Risco', 'Médio Risco', 'Baixo Risco'],
      datasets: [{
        data: [
          data.distribuicaoRisco.alto,
          data.distribuicaoRisco.medio,
          data.distribuicaoRisco.baixo
        ],
        backgroundColor: ['#ff6b6b', '#ffd93d', '#6bff6b']
      }]
    };

    return (
      <div style={{ width: '300px', height: '300px', margin: '20px auto' }}>
        <Doughnut data={chartData} options={{ responsive: true }} />
      </div>
    );
  };

  // Adicione a constante relsFiltrados antes do return
  const relsFiltrados = relatorios.filter(rel =>
    rel.titulo.toLowerCase().includes(busca.toLowerCase())
  );

  const ContentOrPlaceholder = ({ children }) => {
    return children;
  };

  const irParaPerfil = (aluno) => {
    navigate(`/perfil-aluno/${aluno.user_id}`, { state: { aluno } });
  };

  return (
    <div className="relatoriosContainer">
      <h2 style={{ marginBottom: '16px' }}>Relatórios de Evasão</h2>

      <div className="metricsContainer">
        <div className="metricCard">
          <strong>Total de Alunos</strong>
          <p style={{ margin: '4px 0', fontSize: '1.5rem' }}>{estatisticas.totalAlunos}</p>
          <small>Ativos no sistema</small>
        </div>
        <div className="metricCard">
          <strong>Alunos em Risco</strong>
          <p style={{ margin: '4px 0', fontSize: '1.5rem' }}>{estatisticas.alunosRisco}</p>
          <small>Alto + Médio Risco</small>
        </div>
        <div className="metricCard">
          <strong>Média de Participação</strong>
          <p style={{ margin: '4px 0', fontSize: '1.5rem' }}>{estatisticas.mediaEngajamento}%</p>
          <small>Últimos 30 dias</small>
        </div>
        <div className="metricCard">
          <strong>Média Geral</strong>
          <p style={{ margin: '4px 0', fontSize: '1.5rem' }}>{selecionado?.estatisticas?.mediaNotas || 'N/A'}</p>
          <small>Desempenho acadêmico</small>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <button
          onClick={handleGerarRelatorio}
          disabled={isGenerating}
          className={`generateButton ${isGenerating ? 'disabled' : ''}`}
        >
          {isGenerating ? 'Gerando...' : 'Gerar Novo Relatório'}
        </button>
      </div>

      <div className="layoutContainer">
        <div className="sidebarclass">
          <input
            type="text"
            placeholder="Buscar relatórios..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="searchInput"
          />
          <ul className="reportsList">
            {relsFiltrados.map(r => (
              <li
                key={r.id}
                onClick={() => setSelecionado(r)}
                className={`reportItem ${selecionado?.id === r.id ? 'selected' : ''}`}
              >
                <span className="reportIcon">{r.icone}</span>
                <div className="reportInfo">
                  <div className="reportTitle">{r.titulo}</div>
                  <small className="reportDate">{r.data}</small>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="detailArea" id="relatorio-detalhado">
          {selecionado ? (
            <>
              <h3 style={{ marginTop: 0 }}>{selecionado.titulo}</h3>

              {/* Botões de exportação */}
              <div className="exportButtons">
                <button
                  onClick={exportarExcel}
                  className="excelButton"
                >
                  Exportar Excel
                </button>
              </div>

              {/* Gráfico de distribuição */}
              <GraficoDistribuicao data={selecionado.estatisticas} />

              {/* Tabela de alunos */}
              <table className="studentsTable">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Curso</th>
                    <th>Nível de Risco</th>
                    <th>Participação</th>
                    <th>Média</th>
                    <th>Progresso no moodle</th>
                    <th>Último Acesso</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {selecionado.dados.map((aluno, i) => (
                    <tr key={i} className="tableRow">
                      <td className="tableCell">{aluno.nome}</td>
                      <td className="tableCell">{aluno.curso}</td>
                      <td className="tableCell">
                        <span className={`riskBadge ${String(aluno.nivelRisco).includes('Alto') ? 'high' :
                          String(aluno.nivelRisco).includes('Médio') ? 'medium' :
                            String(aluno.nivelRisco).includes('Baixo') ? 'low' : 'unknown'
                          }`}>
                          {aluno.nivelRisco || 'Desconhecido'}
                        </span>
                      </td>
                      <td className="tableCell">{aluno.participacao}%</td>
                      <td className="tableCell">{aluno.media}</td>
                      <td className="tableCell">{aluno.cobertura}%</td>
                      <td className="tableCell">{aluno.ultimoAcesso ? new Date(aluno.ultimoAcesso).toLocaleDateString() : ''}</td>
                      <td>
                        <ContentOrPlaceholder isLoading={[aluno.user_id]}>
                          <button
                            className="profileButton"
                            onClick={() => irParaPerfil(aluno)}
                          >
                            Ver Perfil
                          </button>
                        </ContentOrPlaceholder>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <p>Selecione um relatório na lateral para visualizar os dados.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Relatorios;
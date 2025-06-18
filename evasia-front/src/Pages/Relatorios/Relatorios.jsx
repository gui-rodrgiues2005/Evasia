import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Chart as ChartJS } from 'chart.js/auto';
import { Bar, Doughnut } from 'react-chartjs-2';
import Spiner from '../../Components/Spiner/Spiner';
import './Relatorios.scss';

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

  const calcularRisco = (user) => {
    const hoje = new Date();
    if (!user.user_lastaccess) return 'Desconhecido';

    const dataUltimoAcesso = new Date(user.user_lastaccess);
    const diffDias = (hoje - dataUltimoAcesso) / (1000 * 60 * 60 * 24);

    return diffDias > 30 ? 'Alto risco' : diffDias > 7 ? 'Médio risco' : 'Baixo risco';
  };

  // Buscar usuários
  // 2. Modifique o useEffect de busca de usuários
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
        console.log('Iniciando busca de logs em lote...');

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
        console.log(`Logs obtidos para ${resultados.length} alunos`);

        // Processa os dados dos alunos
        const alunosAtualizados = alunosValidos.map(aluno => {
          const userLogs = resultados.find(r => r.userId === aluno.user_id)?.logs ?? [];
          const participacao = calcularParticipacao(userLogs);
          const engajamento = calcularEngajamento(userLogs);
          const nota = calcularNota(userLogs);
          const risco = calcularRisco(aluno);

          return {
            ...aluno,
            participacao,
            engajamento,
            media: nota.toFixed(1),
            risco,
            logs: userLogs
          };
        });

        // Atualiza os estados
        setAlunosValidos(alunosAtualizados);
        calcularEstatisticas(alunosAtualizados);
        setDadosCarregados(true);

        console.log('Dados processados com sucesso:', {
          totalAlunos: alunosAtualizados.length,
          comLogs: alunosAtualizados.filter(a => a.logs?.length > 0).length
        });

      } catch (err) {
        console.error('Erro ao buscar logs:', err);
      } finally {
        setLoadingLogs(false);
        setDadosProcessados(true);
      }
    };

    buscarLogs();
  }, [alunosValidos.length, dadosCarregados, loadingUsuarios]);// <- Remova alunosValidos da dependência

  const calcularParticipacao = (logs) => {
    const totalEsperado = 50;
    const targetsValidos = ["course", "user_list", "user_profile", "grade_report", "user_report"];
    const interacoesValidas = logs.filter(log => log.action === "viewed" && targetsValidos.includes(log.target));
    return Math.min(100, Math.floor((interacoesValidas.length / totalEsperado) * 100));
  };

  const calcularEngajamento = (logs) => {
    if (!logs || logs.length === 0) return 0;

    const hoje = new Date();
    const pesos = {
      graded: 10,    // Atividade avaliada
      submitted: 7,  // Envio de atividade
      viewed: 2,     // Visualização de conteúdo
      completed: 8,  // Conclusão de atividade
      attempted: 5   // Tentativa de atividade
    };

    // Soma ponderada das interações
    const pontosTotal = logs.reduce((acc, log) => {
      const peso = pesos[log.action] || 0;
      if (!peso) return acc;

      // Fator de decaimento temporal
      const dias = Math.floor((hoje - new Date(log.date)) / (1000 * 60 * 60 * 24));
      let fator = 1;
      if (dias > 30) fator = 0.7;
      if (dias > 60) fator = 0.5;
      if (dias > 90) fator = 0.2;

      return acc + (peso * fator);
    }, 0);

    // Normalização considerando o máximo possível
    const maxPontosPossivel = logs.length * 10; // 10 é o peso máximo
    const engajamento = Math.round((pontosTotal / maxPontosPossivel) * 100);

    return Math.min(100, engajamento);
  };

  const calcularNota = (logs) => {
    if (!logs || logs.length === 0) return 0;

    const totalEsperado = 50;
    const targetsValidos = ["course", "user_list", "user_profile", "grade_report", "user_report"];

    const filtrarInteracoesValidas = (logs) => {
      return logs.filter(log => log.action === "viewed" && targetsValidos.includes(log.target));
    };

    const interacoes = filtrarInteracoesValidas(logs);
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

    return nota;
  };


  // 1. Primeiro declare a função
  const calcularEstatisticas = (alunos) => {
    const stats = alunos.reduce((acc, aluno) => {
      // Contagem de riscos
      if (aluno.risco === 'Alto risco') acc.distribuicaoRisco.alto++;
      else if (aluno.risco === 'Médio risco') acc.distribuicaoRisco.medio++;
      else if (aluno.risco === 'Baixo risco') acc.distribuicaoRisco.baixo++;

      // Soma do engajamento (usando o valor já calculado)
      acc.mediaEngajamento += Number(aluno.engajamento || 0);
      return acc;
    }, {
      totalAlunos: alunos.length,
      alunosRisco: 0,
      mediaEngajamento: 0,
      distribuicaoRisco: { alto: 0, medio: 0, baixo: 0 }
    });

    // Calcular médias apenas se houver alunos
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
    console.log('Tentando gerar relatório. Alunos disponíveis:', alunosValidos.length);

    if (!Array.isArray(alunosValidos) || alunosValidos.length === 0) {
      alert('Não há alunos disponíveis para gerar o relatório');
      return;
    }

    gerarRelatorio();
  };

  // Agora, vamos ajustar a função gerarRelatorio
  const gerarRelatorio = () => {
    if (!alunosValidos.length) return;
    setIsGenerating(true);

    try {
      const dadosRelatorio = alunosValidos.map(aluno => {
        const risco = calcularRisco(aluno);
        const engajamentoIndividual = calcularEngajamento(aluno.logs || []);
        const media = calcularNota(aluno.logs || []);

        // Log para debug do engajamento individual
        console.log(`Engajamento de ${aluno.name}:`, {
          totalLogs: aluno.logs?.length || 0,
          engajamento: engajamentoIndividual,
          media: media.toFixed(1)
        });

        return {
          nome: aluno.fullname || aluno.name,
          curso: aluno.course || 'Não informado',
          nivelRisco: risco,
          porcentagemRisco: risco === 'Alto risco' ? 100 : risco === 'Médio risco' ? 50 : 25,
          ultimoAcesso: new Date(aluno.user_lastaccess).toLocaleDateString('pt-BR'),
          engajamento: engajamentoIndividual,
          mediaNotas: media.toFixed(1),
          userId: aluno.user_id,
          detalhesEngajamento: {
            interacoesUltimos30Dias: aluno.logs?.filter(log => {
              const dias = (new Date() - new Date(log.date)) / (1000 * 60 * 60 * 24);
              return dias <= 30;
            }).length || 0,
            atividadesConcluidas: aluno.logs?.filter(log => log.action === 'completed').length || 0,
            visualizacoes: aluno.logs?.filter(log => log.action === 'viewed').length || 0
          }
        };
      });

      // Calcula médias gerais
      const mediaEngajamentoRelatorio = Math.round(
        dadosRelatorio.reduce((sum, aluno) => sum + aluno.engajamento, 0) / dadosRelatorio.length
      );

      const mediaNotasRelatorio = (
        dadosRelatorio.reduce((sum, aluno) => sum + parseFloat(aluno.mediaNotas), 0) /
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
              aluno.engajamento > (max?.engajamento || 0) ? aluno : max, null),
            alunoMenorEngajamento: dadosRelatorio.reduce((min, aluno) =>
              aluno.engajamento < (min?.engajamento || 100) ? aluno : min, null)
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
          <strong>Média de Engajamento</strong>
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
        <div className="sidebar">
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
                    <th>Engajamento</th>
                    <th>Média</th>
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
                        <div className="riskBar">
                          <div className="barContainer">
                            <div
                              className={`bar ${aluno.nivelRisco === 'Alto risco'
                                ? 'highRisk'
                                : aluno.nivelRisco === 'Médio risco'
                                  ? 'mediumRisk'
                                  : 'lowRisk'
                                }`}
                              style={{ width: `${aluno.porcentagemRisco}%` }}
                            />
                          </div>
                          <span>{aluno.nivelRisco}</span>
                        </div>
                      </td>
                      <td className="tableCell">{aluno.engajamento}%</td>
                      <td className="tableCell">{aluno.mediaNotas}</td>
                      <td className="tableCell">{aluno.ultimoAcesso}</td>
                      <td className="tableCell">
                        <a
                          href={`#/perfil/${aluno.userId}`}
                          className="profileLink"
                        >
                          Ver Perfil
                        </a>
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

import React, { useEffect, useState } from 'react';
import Cards from '../../Components/Cards/Cards';
import { faUserGraduate, faExclamationTriangle, faChartLine, faStar } from '@fortawesome/free-solid-svg-icons';
import './Dashboard.scss';
import GraficoAtividade from '../../Components/grafico_atvSemanal/grafico_atvSemanal';
import GraficoBarras from '../../Components/grafico_barrras/grafico_barras';
import ListaPendencias from '../../Components/ListaPendencias/ListaPendencias';
import Spiner from '../../Components/Spiner/Spiner';

const Dashboard = () => {
  const [logs, setLogs] = useState([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [usuarios, setUsuarios] = useState([]);
  const [totalAlunos, setTotalAlunos] = useState(0);
  const [alunosEmRisco, setAlunosEmRisco] = useState(0);
  const [totalAcoes, setTotalAcoes] = useState(0);
  const [pendencias, setPendencias] = useState([]);
  const [mediaNotas, setMediaNotas] = useState(0);

  useEffect(() => {
    const buscarUsuarios = async () => {
      try {
        const resUsers = await fetch('http://localhost:5164/api/User');
        const dataUsuarios = await resUsers.json();

        setUsuarios(dataUsuarios);
        setTotalAlunos(dataUsuarios.length);

        const emRisco = dataUsuarios.filter(user => {
          const risco = calcularRisco(user);
          return risco === 'Alto risco' || risco === 'Médio risco';
        }).length;

        setAlunosEmRisco(emRisco);

        const taxaEngajamento = calcularTaxaEngajamento(dataUsuarios);
        setTotalAcoes(taxaEngajamento);

        setLoadingUsuarios(false);
      } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        setLoadingUsuarios(false);
      }
    };

    buscarUsuarios();
  }, []);

  useEffect(() => {
    const buscarLogs = async () => {
      if (usuarios.length === 0) return;

      try {
        const ids = usuarios.map(user => user.user_id);

        const resLogs = await fetch('http://localhost:5164/api/LogsUsuario/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ids)
        });

        const logsPorUsuario = await resLogs.json();

        const hoje = new Date();
        let riscoCount = 0;
        let totalAcoesContador = 0;

        for (const user of usuarios) {
          const logsUsuario = logsPorUsuario.find(logs => logs.userId === user.user_id)?.logs || [];

          // Total de ações
          totalAcoesContador += logsUsuario.length;

          // Pendências
          const logsRecentes = logsUsuario.filter(log => {
            const dataLog = new Date(log.date);
            const diffDias = (hoje - dataLog) / (1000 * 60 * 60 * 24);
            return diffDias <= 7;
          });

          const qtdPendencias = logsRecentes.length < 3 ? 3 - logsRecentes.length : 0;
          // Risco
          const risco = calcularRisco(user);
          if (risco === 'Alto risco' || risco === 'Médio risco') {
            riscoCount++;
          }
        }

        setLogs(logsPorUsuario);
        setAlunosEmRisco(riscoCount);
        setTotalAcoes(totalAcoesContador);
  
        const media = calcularMediaTurma(logsPorUsuario);
        setMediaNotas(media);

        setLoadingLogs(false);
      } catch (error) {
        console.error('Erro ao buscar logs:', error);
        setLoadingLogs(false);
      }
    };

    buscarLogs();
  }, [usuarios]);

  

  function calcularRisco(user) {
    if (!user || !user.user_lastaccess) return 'Desconhecido';

    const lastAccess = new Date(user.user_lastaccess);
    const hoje = new Date();
    const diffDias = (hoje - lastAccess) / (1000 * 60 * 60 * 24);

    if (diffDias > 30) return 'Alto risco';
    else if (diffDias > 7) return 'Médio risco';
    else return 'Baixo risco';
  }

  function calcularTaxaEngajamento(usuarios) {
    const hoje = new Date();
    const usuariosEngajados = usuarios.filter(user => {
      if (!user.user_lastaccess) return false;
      const ultimoAcesso = new Date(user.user_lastaccess);
      const diffDias = (hoje - ultimoAcesso) / (1000 * 60 * 60 * 24);
      return diffDias <= 7;
    });

    const taxa = (usuariosEngajados.length / usuarios.length) * 100;
    return Math.round(taxa);
  }

  function calcularNotaAluno(logsUsuario) {
    const hoje = new Date();
    // filtra só ações "graded"
    const logsDeNota = logsUsuario.filter(l => l.action === 'graded');

    if (logsDeNota.length === 0) return 0;

    // último graded
    const ultimaNota = new Date(
      logsDeNota.sort((a, b) => new Date(b.date) - new Date(a.date))[0].date
    );
    const diffDias = (hoje - ultimaNota) / (1000 * 60 * 60 * 24);

    if (diffDias <= 30) return 10;
    if (diffDias <= 60) return 7;
    if (diffDias <= 90) return 5;
    return 0;
  }

  function calcularMediaTurma(logsPorUsuario) {
    const notas = logsPorUsuario.map(u => calcularNotaAluno(u.logs));
    if (notas.length === 0) return 0;
    const soma = notas.reduce((acc, n) => acc + n, 0);
    return (soma / notas.length).toFixed(1);
  }

  if (loadingUsuarios) return <div className='spiner'><Spiner /> Buscando usuários...</div>;

  return (
    <div className='dashboard-section'>
      <h2 className='title-section'>Dashboard</h2>

      <div className='Cards'>
        <Cards
          title="Total de Alunos"
          quantidade={totalAlunos}
          icon={faUserGraduate}
          porcentagem="+12%"
          informacao=" do semestre anterior"
        />
        <Cards
          title="Alunos em risco"
          quantidade={alunosEmRisco}
          icon={faExclamationTriangle}
          porcentagem="14%"
          informacao=" dos alunos ativos"
          loading={loadingLogs}
        />

        <Cards
          title="Taxa de Engajamento"
          quantidade={`${totalAcoes}%`}
          icon={faChartLine}
          porcentagem="+4%"
          informacao=" usuários ativos nos últimos 7 dias"
        />

        <Cards
          title="Média de Notas"
          quantidade={mediaNotas}
          icon={faStar}
          porcentagem="+3%"
          informacao=" no semestre atual"
          loading={loadingLogs}
        />
      </div>

      <div className='graficos'>
        <GraficoAtividade />
        <GraficoBarras />
      </div>

      {loadingLogs ? (
        <div className='spiner'><Spiner /> Analisando logs dos alunos...</div>
      ) : (
        <ListaPendencias className="listaPendecias" pendencias={pendencias} />
      )}
    </div>
  );
};

export default Dashboard;

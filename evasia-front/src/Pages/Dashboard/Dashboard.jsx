import React, { useEffect, useState } from 'react';
import Cards from '../../Components/Cards/Cards';
import { faUserGraduate, faExclamationTriangle, faChartLine, faStar } from '@fortawesome/free-solid-svg-icons';
import './Dashboard.scss';
import GraficoAtividade from '../../Components/grafico_atvSemanal/grafico_atvSemanal';
import GraficoBarras from '../../Components/grafico_barrras/grafico_barras';
import ListaPendencias from '../../Components/ListaPendencias/ListaPendencias';
import Spiner from '../../Components/Spiner/Spiner';

const Dashboard = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [logs, setLogs] = useState([]);
  const [pendencias, setPendencias] = useState([]);
  const [totalAlunos, setTotalAlunos] = useState(0);
  const [alunosEmRisco, setAlunosEmRisco] = useState(0);
  const [totalAcoes, setTotalAcoes] = useState(0);
  const [mediaNotas, setMediaNotas] = useState(0);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);

  useEffect(() => {
    const buscarUsuarios = async () => {
      try {
        const res = await fetch('http://localhost:5164/api/User');
        const data = await res.json();

        setUsuarios(data);
        setTotalAlunos(data.length);
        setTotalAcoes(calcularTaxaEngajamento(data));

        const emRisco = data.filter(user => {
          const risco = calcularRisco(user);
          return risco === 'Alto risco' || risco === 'Médio risco';
        }).length;
        setAlunosEmRisco(emRisco);
      } catch (err) {
        console.error('Erro ao buscar usuários:', err);
      } finally {
        setLoadingUsuarios(false);
      }
    };

    buscarUsuarios();
  }, []);

  useEffect(() => {
    const buscarLogs = async () => {
      if (!usuarios.length) return;

      setLoadingLogs(true);

      try {
        const alunosValidos = usuarios.filter(u => u.name?.trim().split(/\s+/).length >= 3 && !u.user_id.startsWith('USER_'));

        const promessas = alunosValidos.map(async user => {
          const res = await fetch('http://localhost:5164/api/LogsUsuario/logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user.user_id)
          });
          const dados = await res.json();
          return { userId: user.user_id, logs: dados };
        });

        const logsUsuarios = await Promise.all(promessas);
        setLogs(logsUsuarios);
        setAlunosEmRisco(logsUsuarios.filter(l => calcularRisco(usuarios.find(u => u.user_id === l.userId)) !== 'Baixo risco').length);
        setTotalAcoes(logsUsuarios.reduce((acc, curr) => acc + curr.logs.length, 0));
        setMediaNotas(calcularMediaTurma(logsUsuarios));

      } catch (err) {
        console.error('Erro ao buscar logs:', err);
      } finally {
        setLoadingLogs(false);
      }
    };

    buscarLogs();
  }, [usuarios]);

  const calcularRisco = (user) => {
    const hoje = new Date();
    if (!user.user_lastaccess) return 'Desconhecido';
    const diffDias = (hoje - new Date(user.user_lastaccess)) / (1000 * 60 * 60 * 24);
    return diffDias > 30 ? 'Alto risco' : diffDias > 7 ? 'Médio risco' : 'Baixo risco';
  };

  const calcularTaxaEngajamento = (users) => {
    const hoje = new Date();
    const ativos = users.filter(user => {
      if (!user.user_lastaccess) return false;
      return (hoje - new Date(user.user_lastaccess)) / (1000 * 60 * 60 * 24) <= 7;
    });
    return Math.round((ativos.length / users.length) * 100);
  };

  const calcularNotaAluno = (logsUsuario) => {
    const hoje = new Date();
    const pesos = { graded: 10, submitted: 7, viewed: 2, completed: 8, attempted: 5 };

    const notaTotal = logsUsuario.reduce((acc, log) => {
      const peso = pesos[log.action] || 0;
      if (!peso) return acc;

      const dias = (hoje - new Date(log.date)) / (1000 * 60 * 60 * 24);
      const fator = dias <= 30 ? 1 : dias <= 60 ? 0.7 : dias <= 90 ? 0.5 : 0.2;
      return acc + peso * fator;
    }, 0);

    const max = 10 * logsUsuario.length;
    return Math.min(10, Math.max(0, (notaTotal / max) * 10));
  };

  const calcularMediaTurma = (logsUsuarios) => {
    const notas = logsUsuarios.map(u => calcularNotaAluno(u.logs));
    return (notas.reduce((acc, n) => acc + n, 0) / notas.length).toFixed(1);
  };

  if (loadingUsuarios) return <div className='spiner'><Spiner /> Buscando usuários...</div>;

  return (
    <div className='dashboard-section'>
      <h2 className='title-section'>Dashboard</h2>

      <div className='Cards'>
        <Cards title="Total de Alunos" quantidade={totalAlunos} icon={faUserGraduate} porcentagem="+12%" informacao=" do semestre anterior" />
        <Cards title="Alunos em risco" quantidade={alunosEmRisco} icon={faExclamationTriangle} porcentagem="14%" informacao=" dos alunos ativos" loading={loadingLogs} />
        <Cards title="Taxa de Engajamento" quantidade={`${totalAcoes}%`} icon={faChartLine} porcentagem="+4%" informacao=" usuários ativos nos últimos 7 dias" />
        <Cards title="Média de Notas" quantidade={mediaNotas} icon={faStar} porcentagem="+3%" informacao=" no semestre atual" loading={loadingLogs} />
      </div>

      <div className='graficos'>
        <GraficoAtividade />
        <GraficoBarras />
      </div>

      {loadingLogs ? <div className='spiner'><Spiner /> Analisando logs dos alunos...</div> : <ListaPendencias className="listaPendecias" pendencias={pendencias} />}
    </div>
  );
};

export default Dashboard;
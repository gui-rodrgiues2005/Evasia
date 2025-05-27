import React, { useEffect, useState } from 'react';
import Cards from '../../Components/Cards/Cards';
import { faUserGraduate, faExclamationTriangle, faChartLine, faStar } from '@fortawesome/free-solid-svg-icons';
import './Dashboard.scss';
import GraficoAtividade from '../../Components/grafico_atvSemanal/grafico_atvSemanal';
import GraficoBarras from '../../Components/grafico_barrras/grafico_barras';
import ListaPendencias from '../../Components/ListaPendencias/ListaPendencias';
import Spiner from '../../Components/Spiner/Spiner'

const Dashboard = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalAlunos, setTotalAlunos] = useState(0);
  const [alunosEmRisco, setAlunosEmRisco] = useState(0);
  const [totalAcoes, setTotalAcoes] = useState(0);
  const [pendencias, setPendencias] = useState([]);

  useEffect(() => {
    const buscarDados = async () => {
      try {
        const resUsers = await fetch('http://localhost:5164/api/User');
        const usuarios = await resUsers.json();
        setTotalAlunos(usuarios.length);

        const cincoUsuarios = usuarios.slice(0, 3);
        const hoje = new Date();

        const pendenciasCalculadas = [];

        for (const user of cincoUsuarios) {
          // Buscar logs por usuário individualmente
          const resLogs = await fetch('http://localhost:5164/api/LogsUsuario/logs', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(user.user_id)
          });

          const logsUsuario = await resLogs.json();

          const logsRecentes = logsUsuario.filter(log => {
            const dataLog = new Date(log.date);
            const diffDias = (hoje - dataLog) / (1000 * 60 * 60 * 24);
            return diffDias <= 7;
          });

          const qtdPendencias = logsRecentes.length < 3 ? 3 - logsRecentes.length : 0;

          if (qtdPendencias > 0) {
            pendenciasCalculadas.push({
              id: user.user_id,
              nome: user.name,
              qtdPendencias,
              data: new Date(user.user_lastaccess).toLocaleDateString('pt-BR')
            });
          }
        }

        setPendencias(pendenciasCalculadas);
        setLoading(false);

      } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
        setLoading(false);
      }
    };
    buscarDados();
  }, []);

  if (loading) return <div className='spiner'><Spiner/> Buscando dados....</div>;

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
        />
        <Cards
          title="Taxa de Engajamento"
          quantidade={totalAcoes}
          icon={faChartLine}
          porcentagem="+4%"
          informacao=" ações registradas"
        />
        <Cards
          title="Média de Notas"
          quantidade="8.4"
          icon={faStar}
          porcentagem="+3%"
          informacao=" no semestre atual"
        />
      </div>

      <div className='graficos'>
        <GraficoAtividade />
        <GraficoBarras />
      </div>

      <ListaPendencias className="listaPendecias" pendencias={pendencias} />
    </div>
  );
};

export default Dashboard;

import React from 'react';
import Cards from '../../Components/Cards/Cards';
import { faUserGraduate, faExclamationTriangle, faChartLine, faStar } from '@fortawesome/free-solid-svg-icons';
import './Dashboard.scss';
import GraficoAtividade from '../../Components/grafico_atvSemanal/grafico_atvSemanal';
import GraficoBarras from '../../Components/grafico_barrras/grafico_barras';
import ListaPendencias from '../../Components/ListaPendencias/ListaPendencias';


const Dashboard = () => {

  const pendencias = [
    { nome: 'Maria Oliveira', qtdPendencias: 3, data: '13/05/2025' },
    { nome: 'João Silva', qtdPendencias: 2, data: '12/05/2025' },
    { nome: 'Ana Souza', qtdPendencias: 4, data: '11/05/2025' },
    { nome: 'Carlos Lima', qtdPendencias: 3, data: '10/05/2025' },
    { nome: 'Juliana Reis', qtdPendencias: 1, data: '09/05/2025' }
  ];

  return (
    <div className='dashboard-section'>
      <h2 className='title-section'>Dashboard</h2>

      <div className='Cards'>
        <Cards
          title="Total de Alunos"
          quantidade="248"
          icon={faUserGraduate}
          porcentagem="+12%"
          informacao=" do semestre anterior"
        />
        <Cards
          title="Alunos em risco"
          quantidade="37"
          icon={faExclamationTriangle}
          porcentagem="14%"
          informacao=" dos alunos ativos"
        />
        <Cards
          title="Taxa de Engajamento"
          quantidade="765"
          icon={faChartLine}
          porcentagem="+4%"
          informacao=" em relação ao mês anterior"
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
  )
}

export default Dashboard

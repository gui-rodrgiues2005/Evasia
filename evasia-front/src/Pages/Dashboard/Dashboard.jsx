import React, {useEffect, useState} from 'react';
import Cards from '../../Components/Cards/Cards';
import {faUserGraduate, faExclamationTriangle, faChartLine, faStar} from '@fortawesome/free-solid-svg-icons';
import './Dashboard.scss';
import GraficoAtividade from '../../Components/grafico_atvSemanal/grafico_atvSemanal';
import GraficoBarras from '../../Components/grafico_barrras/grafico_barras';
import ListaPendencias from '../../Components/ListaPendencias/ListaPendencias';
import Spiner from '../../Components/Spiner/Spiner';

const Dashboard = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [alunosValidos, setAlunosValidos] = useState([]);
    const [logs, setLogs] = useState([]);
    const [pendencias, setPendencias] = useState([]);
    const [totalAlunos, setTotalAlunos] = useState(0);
    const [alunosEmRisco, setAlunosEmRisco] = useState(0);
    const [totalAcoes, setTotalAcoes] = useState(0);
    const [mediaNotas, setMediaNotas] = useState(0);
    const [loadingUsuarios, setLoadingUsuarios] = useState(true);
    const [loadingLogs, setLoadingLogs] = useState(true);

    const [alunosPorRisco, setAlunosPorRisco] = useState({
        alto: 0,
        medio: 0,
        baixo: 0,
    });

    const calcularRisco = (user) => {
        const hoje = new Date();

        if (!user.user_lastaccess) return 'Desconhecido';

        const dataUltimoAcesso = new Date(user.user_lastaccess);
        const diffDias = (hoje - dataUltimoAcesso) / (1000 * 60 * 60 * 24);


        console.log(`Usuário: ${user.name}, Último acesso: ${dataUltimoAcesso.toLocaleDateString()}, Dias desde último acesso: ${diffDias.toFixed(0)}`);

        return diffDias > 30 ? 'Alto risco' : diffDias > 7 ? 'Médio risco' : 'Baixo risco';
    };


    useEffect(() => {
        const buscarUsuarios = async () => {
            try {
                const res = await fetch('http://localhost:5164/api/User');
                const data = await res.json();

                // 1. Filtrar somente os alunos válidos
                const alunosFiltrados = data.filter(u => {
                    const nome = u.name?.trim();
                    const partesNome = nome?.split(/\s+/) || [];
                    const nomeValido = partesNome.length >= 3;
                    const soLetras = partesNome.every(parte => /^[A-Za-zÀ-ÿ]+$/.test(parte));
                    return nomeValido && soLetras && !u.user_id.startsWith('USER_');
                });

                setAlunosValidos(alunosFiltrados);

                // 2. Calcular risco apenas dos válidos
                const alunosComRisco = alunosFiltrados.map(user => {
                    const risco = calcularRisco(user);
                    console.log(`Usuário: ${user.name}, Risco: ${risco}`);
                    return { ...user, risco };
                });
                setUsuarios(alunosComRisco);
                setTotalAlunos(alunosComRisco.length);

                // 3. Contar os tipos de risco
                let riscoAlto = 0, riscoMedio = 0, riscoBaixo = 0;
                alunosComRisco.forEach(user => {
                    if (user.risco === 'Alto risco') riscoAlto++;
                    else if (user.risco === 'Médio risco') riscoMedio++;
                    else if (user.risco === 'Baixo risco') riscoBaixo++;
                });

                setAlunosPorRisco({ alto: riscoAlto, medio: riscoMedio, baixo: riscoBaixo });
                setAlunosEmRisco(riscoAlto + riscoMedio);

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
            if (!alunosValidos.length) return;

            setLoadingLogs(true);

            try {
                const promessas = alunosValidos.map(async user => {
                    const res = await fetch('http://localhost:5164/api/LogsUsuario/logs', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify(user.user_id)
                    });
                    const dados = await res.json();
                    return {userId: user.user_id, logs: dados};
                });

                const logsUsuarios = await Promise.all(promessas);
                setLogs(logsUsuarios);

                let somaNotas = 0;

                logsUsuarios.forEach(({userId, logs}) => {
                    const user = alunosValidos.find(u => u.user_id === userId);
                    if (!user) return;
                    const nota = calcularNotaAluno(logs);
                    somaNotas += nota;
                });

                setTotalAcoes(logsUsuarios.reduce((acc, curr) => acc + curr.logs.length, 0));
                setMediaNotas((somaNotas / logsUsuarios.length).toFixed(1));

            } catch (err) {
                console.error('Erro ao buscar logs:', err);
            } finally {
                setLoadingLogs(false);
            }
        };

        buscarLogs();
    }, [alunosValidos]);

    const calcularNotaAluno = (logsUsuario) => {
        const hoje = new Date();
        const pesos = {graded: 10, submitted: 7, viewed: 2, completed: 8, attempted: 5};

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

    if (loadingUsuarios) return <div className='spiner'><Spiner/> Buscando usuários...</div>;

    return (
        <div className='dashboard-section'>
            <h2 className='title-section'>Dashboard</h2>

            <div className='Cards'>
                <Cards title="Total de Alunos" quantidade={alunosValidos.length} icon={faUserGraduate}
                       porcentagem="+12%"
                       informacao=" do semestre anterior"/>
                <Cards title="Alunos em risco" quantidade={alunosPorRisco.alto} icon={faExclamationTriangle}
                       porcentagem="14%"
                       informacao=" dos alunos ativos" loading={loadingLogs}/>
                <Cards title="Taxa de Engajamento" quantidade={`${totalAcoes}%`} icon={faChartLine} porcentagem="+4%"
                       informacao=" usuários ativos nos últimos 7 dias"/>
                <Cards title="Média de Notas" quantidade={mediaNotas} icon={faStar} porcentagem="+3%"
                       informacao=" no semestre atual" loading={loadingLogs}/>
            </div>

            <div className='graficos'>
                <GraficoAtividade/>
                <GraficoBarras quantidade={alunosPorRisco}/>
            </div>

            {loadingLogs ? (
                <div className='spiner'><Spiner/> Analisando logs dos alunos...</div>
            ) : (
                <ListaPendencias className="listaPendecias" pendencias={pendencias}/>
            )}
        </div>
    );
};

export default Dashboard;

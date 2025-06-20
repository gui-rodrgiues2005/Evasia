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

    const [estatisticas, setEstatisticas] = useState({
        totalAlunos: 0,
        alunosEmRisco: 0,
        totalAcoes: 0,
        mediaNotas: 0,
        alunosPorRisco: {
            alto: 0,
            medio: 0,
            baixo: 0,
        },
    });

    useEffect(() => {
        if (alunosValidos.length > 0) {
            calcularEstatisticas(alunosValidos);
        }
    }, [alunosValidos]);

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

    // 3. Modifique o useEffect dos logs para usar a nova função
    useEffect(() => {
        const buscarLogs = async () => {
            if (!alunosValidos.length) return;

            setLoadingLogs(true);
            try {
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
                console.log('Logs obtidos em lote:', resultados.length);

                // Atualiza os alunos mantendo TODOS os dados originais
                const alunosAtualizados = alunosValidos.map(aluno => {
                    const userLogs = resultados.find(r => r.userId === aluno.user_id)?.logs ?? [];
                    return {
                        ...aluno, // Mantém todos os dados originais, incluindo o risco
                        logs: userLogs
                    };
                });

                // Atualiza o estado com os alunos completos
                setAlunosValidos(alunosAtualizados);

                // Log para debug
                console.log('Alunos atualizados com logs:', {
                    total: alunosAtualizados.length,
                    comLogs: alunosAtualizados.filter(a => a.logs?.length > 0).length
                });

            } catch (err) {
                console.error('Erro ao buscar logs:', err);
            } finally {
                setLoadingLogs(false);
            }
        };

        buscarLogs();
    }, [alunosValidos.length]);

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

        const pontosTotal = logs.reduce((acc, log) => {
            const peso = pesos[log.action] || 0;
            if (!peso) return acc;

            const dias = Math.floor((hoje - new Date(log.date)) / (1000 * 60 * 60 * 24));
            let fator = 1;
            if (dias > 30) fator = 0.7;
            if (dias > 60) fator = 0.5;
            if (dias > 90) fator = 0.2;

            return acc + (peso * fator);
        }, 0);

        const maxPontosPossivel = logs.length * 10;
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

    if (loadingUsuarios) return <div className='spiner'><Spiner /> Buscando usuários...</div>;

    const calcularEstatisticas = (alunos) => {
        if (!alunos || !alunos.length) return;
        const riscos = {
            alto: alunos.filter(a => a.risco === 'Alto risco').length,
            medio: alunos.filter(a => a.risco === 'Médio risco').length,
            baixo: alunos.filter(a => a.risco === 'Baixo risco').length
        };

        // Cálculo de médias
        let somaEngajamento = 0;
        let somaNotas = 0;

        alunos.forEach(aluno => {
            somaEngajamento += calcularEngajamento(aluno.logs || []);
            somaNotas += calcularNota(aluno.logs || []);
        });

        const stats = {
            totalAlunos: alunos.length,
            alunosRisco: riscos.alto + riscos.medio,
            mediaEngajamento: Math.round(somaEngajamento / alunos.length),
            mediaNotas: Number((somaNotas / alunos.length).toFixed(1)),
            alunosPorRisco: riscos
        };

        setEstatisticas(stats);
        console.log('Estatísticas calculadas:', {
            riscos,
            stats
        });
    };

    return (
        <div className='dashboard-section'>
            <h2 className='title-section'>Dashboard</h2>

            <div className='Cards'>
                <Cards
                    title="Total de Alunos"
                    quantidade={estatisticas.totalAlunos}
                    icon={faUserGraduate}
                    porcentagem="+12%"
                    informacao=" do semestre anterior"
                />
                <Cards
                    title="Alunos em risco"
                    quantidade={estatisticas.alunosRisco}
                    icon={faExclamationTriangle}
                    porcentagem={`${((estatisticas.alunosRisco / estatisticas.totalAlunos) * 100).toFixed(0)}%`}
                    informacao=" dos alunos ativos"
                    loading={loadingLogs}
                />
                <Cards
                    title="Taxa de Engajamento"
                    quantidade={`${estatisticas.mediaEngajamento}`}
                    icon={faChartLine}
                    porcentagem="+4%"
                    informacao=" usuários ativos nos últimos 7 dias"
                />
                <Cards
                    title="Média de Notas"
                    quantidade={estatisticas.mediaNotas}
                    icon={faStar}
                    porcentagem="+3%"
                    informacao=" no semestre atual"
                    loading={loadingLogs}
                />
            </div>

            <div className='graficos'>
                <GraficoAtividade />
                <GraficoBarras quantidade={alunosPorRisco} />
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

import React, { useEffect, useState } from 'react';
import Cards from '../../Components/Cards/Cards';
import { faUserGraduate, faExclamationTriangle, faChartLine, faStar } from '@fortawesome/free-solid-svg-icons';
import './Dashboard.scss';
import GraficoAtividade from '../../Components/grafico_atvSemanal/grafico_atvSemanal';
import GraficoBarras from '../../Components/grafico_barrras/grafico_barras';
import ListaPendencias from '../../Components/ListaPendencias/ListaPendencias';
import Spiner from '../../Components/Spiner/Spiner';
import LoadingCards from '../../Components/LoadingCards/LoadingCards';


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

function normalizarNome(nome) {
    return nome?.toString().trim().toLowerCase().replace(/\s+/g, '');
}

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

function calcularParticipacao(logs) {
    if (!logs || logs.length === 0) return 0;
    const interacoes = logs.filter(log => log.action === "viewed" && targetsValidos.includes(log.target));
    return Math.min(100, Math.floor((interacoes.length / totalEsperado) * 100));
}

function calcularCoberturaDeModulos(logs) {
    if (!logs || logs.length === 0) return 0;
    const acoes = logs
        .filter(log => acoesValidas.includes(log.action))
        .map(log => `${normalizarNome(log.name)}|${log.component}|${log.target}`);
    const acoesUnicas = [...new Set(acoes)];
    const totalFeito = acoesUnicas.length;
    return Math.min(100, Math.round((totalFeito / totalEsperado) * 100));
}

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

                const alunosAtualizados = alunosValidos.map(aluno => {
                    const userLogs = resultados.find(r => r.userId === aluno.user_id)?.logs ?? [];
                    const participacao = calcularParticipacao(userLogs);
                    const cobertura = calcularCoberturaDeModulos(userLogs);
                    const media = calcularNota(userLogs).toFixed(1);
                    const risco = calcularRisco(aluno, participacao, parseFloat(media));
                    return {
                        ...aluno,
                        logs: userLogs,
                        participacao,
                        cobertura,
                        media,
                        risco
                    };
                });
                setAlunosValidos(alunosAtualizados);

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

    // Função para contar acessos por dia da semana
    const getAcessosPorDia = () => {
        const todosLogs = alunosValidos.flatMap(aluno => aluno.logs || []);
        const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const acessos = { Domingo: 0, Segunda: 0, Terça: 0, Quarta: 0, Quinta: 0, Sexta: 0, Sábado: 0 };

        todosLogs.forEach(log => {
            if (!log.date) return;
            const data = new Date(log.date);
            const diaSemana = dias[data.getDay()];
            acessos[diaSemana]++;
        });
        return dias.map(dia => ({
            dia,
            interacoes: acessos[dia]
        }));
    };

    const loading = loadingUsuarios || loadingLogs;

    return (
        <div className='dashboard-section'>
            <h2 className='title-section'>Dashboard</h2>

            <div className='Cards'>
                {loading ? (
                    <>
                        <div className="card-skeleton">
                            <div className="skeleton skeleton-title" />
                            <div className="skeleton skeleton-value" />
                            <div className="skeleton skeleton-sub" />
                        </div>
                        <div className="card-skeleton">
                            <div className="skeleton skeleton-title" />
                            <div className="skeleton skeleton-value" />
                            <div className="skeleton skeleton-sub" />
                        </div>
                        <div className="card-skeleton">
                            <div className="skeleton skeleton-title" />
                            <div className="skeleton skeleton-value" />
                            <div className="skeleton skeleton-sub" />
                        </div>
                        <div className="card-skeleton">
                            <div className="skeleton skeleton-title" />
                            <div className="skeleton skeleton-value" />
                            <div className="skeleton skeleton-sub" />
                        </div>
                    </>
                ) : (
                    <>
                        <Cards
                            title="Total de Alunos"
                            quantidade={estatisticas.totalAlunos}
                            icon={faUserGraduate}
                            informacao="no curso"
                        />
                        <Cards
                            title="Alunos em risco"
                            quantidade={estatisticas.alunosRisco}
                            icon={faExclamationTriangle}
                            informacao="em risco de evasão"
                        />
                        <Cards
                            title="Taxa de Engajamento"
                            quantidade={`${estatisticas.mediaEngajamento}%`}
                            icon={faChartLine}
                            informacao="engajamento médio"
                        />
                        <Cards
                            title="Média de Notas"
                            quantidade={estatisticas.mediaNotas}
                            icon={faStar}
                            informacao="desempenho geral"
                        />
                    </>
                )}
            </div>

            <div className='graficos'>
                <GraficoAtividade data={getAcessosPorDia()} loading={loading} />
                <GraficoBarras quantidade={estatisticas.alunosPorRisco} loading={loading} />
            </div>
        </div>
    );
};

export default Dashboard;

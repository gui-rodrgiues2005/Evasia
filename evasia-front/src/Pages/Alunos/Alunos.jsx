import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import Spiner from '../../Components/Spiner/Spiner';
import './Alunos.scss';

const frasesLoading = [
    "Analisando informações acadêmicas...",
    "Coletando dados de participação dos alunos...",
    "Calculando indicadores de risco de evasão...",
    "Por favor, aguarde. Isso pode levar alguns segundos."
];

const Alunos = () => {
    const [filtro, setFiltro] = useState('Todos');
    const [busca, setBusca] = useState('');
    const [alunos, setAlunos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(true);
    const [alunosValidos, setAlunosValidos] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [totalAlunos, setTotalAlunos] = useState(0);
    const [alunosEmRisco, setAlunosEmRisco] = useState(0);
    const [mediaNotas, setMediaNotas] = useState(0);
    const [totalAcoes, setTotalAcoes] = useState(0);
    const [loadingItems, setLoadingItems] = useState({});
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [fraseIndex, setFraseIndex] = useState(0);

    useEffect(() => {
        if (loading || loadingLogs) {
            setFraseIndex(0);
            const interval = setInterval(() => {
                setFraseIndex(prev =>
                    prev < frasesLoading.length - 1 ? prev + 1 : 0
                );
            }, 2500); // Troca a cada 2.5 segundos

            return () => clearInterval(interval);
        }
    }, [loading, loadingLogs]);

    useEffect(() => {
        const filtroParam = searchParams.get('filtro');
        if (filtroParam) {
            const filtroDecodificado = decodeURIComponent(filtroParam);
            setFiltro(filtroDecodificado);
            console.log('Filtro definido:', filtroDecodificado);
        }
    }, [searchParams]);

    const updateLoadingItem = (userId, isLoading) => {
        setLoadingItems(prev => ({
            ...prev,
            [userId]: isLoading
        }));
    };

    const irParaPerfil = (aluno) => {
        navigate(`/perfil-aluno/${aluno.user_id}`, { state: { aluno } });
    };

    const [alunosPorRisco, setAlunosPorRisco] = useState({
        alto: 0,
        medio: 0,
        baixo: 0,
    });

    const calcularRisco = (user) => {
        const hoje = new Date();

        if (!user.user_lastaccess) return 'Alto risco';

        const dataUltimoAcesso = new Date(user.user_lastaccess);
        const diffDias = (hoje - dataUltimoAcesso) / (1000 * 60 * 60 * 24);

        return diffDias > 30 ? 'Alto risco' :
            diffDias > 7 ? 'Médio risco' :
                'Baixo risco';
    };

    function calcularAtividadesPendentes(modulosTotais, logs) {
        let pendentes = 0;
        modulosTotais.forEach(modulo => {
            const foiFeito = logs.some(log =>
                log.target === 'course_module' &&
                log.component === modulo.component &&
                log.name === modulo.name &&
                log.action === 'viewed'
            );
            if (!foiFeito) pendentes++;
        });
        return pendentes;
    }

    function extrairModulosDeMaiorParticipante(logsUsuarios) {
        let maior = null;
        for (let userLogs of logsUsuarios) {
            if (!maior || userLogs.logs.length > maior.logs.length) {
                maior = userLogs;
            }
        }
        if (!maior) return [];

        const modulos = maior.logs
            .filter(log => log.target === 'course_module' && log.action === 'viewed')
            .map(log => ({
                name: log.name,
                component: log.component
            }));

        const modulosUnicos = modulos.filter((mod, index, self) =>
            index === self.findIndex(m =>
                m.name === mod.name && m.component === mod.component
            )
        );

        return modulosUnicos;
    }

    useEffect(() => {
        fetch('http://localhost:5164/api/User')
            .then(response => response.json())
            .then(data => {
                const alunosFiltrados = data.filter(u => {
                    const nome = u.name?.trim();
                    const partesNome = nome?.split(/\s+/) || [];
                    const nomeValido = partesNome.length >= 3;
                    const soLetras = partesNome.every(parte => /^[A-Za-zÀ-ÿ]+$/.test(parte));
                    return nomeValido && soLetras && !u.user_id.startsWith('USER_');
                });

                const alunosCompletos = alunosFiltrados.map(aluno => ({
                    ...aluno,
                    email: `${aluno.name.toLowerCase().replace(/\s+/g, '')}@aluno.unifenas.br`,
                    curso: 'Ciência da Computação',
                }));

                const alunosComRisco = alunosFiltrados.map(user => {
                    const riscoCompleto = calcularRisco(user);
                    const risco = riscoCompleto.includes('Alto') ? 'Alto' :
                        riscoCompleto.includes('Médio') ? 'Médio' :
                            riscoCompleto.includes('Baixo') ? 'Baixo' : 'Desconhecido';

                    return { ...user, risco };
                });

                setUsuarios(alunosComRisco);
                setTotalAlunos(alunosComRisco.length);

                let riscoAlto = 0, riscoMedio = 0, riscoBaixo = 0;
                alunosComRisco.forEach(user => {
                    if (user.risco === 'Alto risco') riscoAlto++;
                    else if (user.risco === 'Médio risco') riscoMedio++;
                    else if (user.risco === 'Baixo risco') riscoBaixo++;
                });

                setAlunosPorRisco({ alto: riscoAlto, medio: riscoMedio, baixo: riscoBaixo });
                setAlunosEmRisco(riscoAlto + riscoMedio);

                setAlunos(alunosCompletos);
                setAlunosValidos(alunosCompletos);
                setLoading(false);
            })
            .catch(error => {
                console.error('Erro ao buscar alunos:', error);
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        const totalEsperado = 50;
        const targetsValidos = [
            "course",
            "user_list",
            "user_profile",
            "grade_report",
            "user_report"
        ];

        const filtrarInteracoesValidas = (logs) => {
            return logs.filter(log => log.action === "viewed" && targetsValidos.includes(log.target));
        };

        const calcularParticipacao = (interacoes) => {
            return Math.min(100, Math.floor((interacoes.length / totalEsperado) * 100));
        };

        const buscarLogs = async () => {
            if (!alunosValidos.length) return;

            setLoadingLogs(true);
            try {
                // Inicializa loading state
                const initialLoadingState = {};
                alunosValidos.forEach(aluno => {
                    initialLoadingState[aluno.user_id] = true;
                });
                setLoadingItems(initialLoadingState);

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

                // Atualiza loading state para todos os alunos
                const updatedLoadingState = {};
                userIds.forEach(id => {
                    updatedLoadingState[id] = false;
                });
                setLoadingItems(updatedLoadingState);

                setLogs(resultados);

                const modulosEsperados = extrairModulosDeMaiorParticipante(resultados);
                let somaNotas = 0;

                const novosAlunos = alunosValidos.map(aluno => {
                    const logs = resultados.find(r => r.userId === aluno.user_id)?.logs ?? [];
                    const interacoes = filtrarInteracoesValidas(logs);
                    const participacao = calcularParticipacao(interacoes);

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

                    const pendentes = calcularAtividadesPendentes(modulosEsperados, logs);

                    somaNotas += nota;

                    const riscoCompleto = calcularRisco(aluno);
                    const risco = riscoCompleto.includes('Alto') ? 'Alto risco' :
                        riscoCompleto.includes('Médio') ? 'Médio risco' :
                            riscoCompleto.includes('Baixo') ? 'Baixo risco' :
                                'Desconhecido';

                    return {
                        ...aluno,
                        participacao,
                        media: nota.toFixed(1),
                        pendentes,
                        ultimosAcessos: interacoes.map(i => i.date),
                        risco
                    };
                });

                const mediaGeral = (somaNotas / alunosValidos.length).toFixed(1);

                // Atualiza todos os estados de uma vez
                setAlunos(novosAlunos);
                setAlunosValidos(novosAlunos);
                setTotalAcoes(resultados.reduce((acc, curr) => acc + (curr.logs?.length || 0), 0));
                setMediaNotas(mediaGeral);

                console.log('Dados processados com sucesso:', {
                    totalAlunos: novosAlunos.length,
                    mediaGeral,
                    totalLogs: resultados.reduce((acc, curr) => acc + (curr.logs?.length || 0), 0)
                });

            } catch (err) {
                console.error('Erro ao buscar logs:', err);
                // Limpa loading state em caso de erro
                const errorLoadingState = {};
                alunosValidos.forEach(aluno => {
                    errorLoadingState[aluno.user_id] = false;
                });
                setLoadingItems(errorLoadingState);
            } finally {
                setLoadingLogs(false);
            }
        };

        buscarLogs();
    }, [alunosValidos.length]);

    const LoadingPlaceholder = () => (
        <div style={{
            display: 'inline-block',
            width: '100%',
            height: '16px',
            backgroundColor: '#f0f0f0',
            borderRadius: '4px',
            animation: 'pulse 1.5s infinite ease-in-out'
        }}></div>
    );

    const riscoCor = {
        'Alto': '#e53935',    // vermelho
        'Médio': '#fbc02d',   // amarelo
        'Baixo': '#43a047',   // verde
        'Desconhecido': '#999' // cinza
    };

    const pulseAnimation = `
        @keyframes pulse {
            0% { opacity: 0.6; }
            50% { opacity: 0.3; }
            100% { opacity: 0.6; }
        }
    `;

    const ContentOrPlaceholder = ({ isLoading, children }) => {
        if (isLoading) {
            return <LoadingPlaceholder />;
        }
        return children;
    };

    const alunosFiltrados = alunosValidos.filter(aluno => {
        const matchBusca = aluno.name.toLowerCase().includes(busca.toLowerCase());
        const matchFiltro = filtro === 'Todos' || aluno.risco === filtro;

        console.log('Filtrando:', {
            aluno: aluno.name,
            riscoAluno: aluno.risco,
            filtroAtual: filtro,
            match: matchFiltro
        });

        return matchBusca && matchFiltro;
    });



    if (loading) return <div className='spiner'><Spiner /> Verificando dados....</div>;
    if (loading || loadingLogs) {
        return (
            <div className="loadingOverlay">
                <div className="spinner" />
                <div className="loadingText">
                    <p>{frasesLoading[fraseIndex]}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="alunosContainer">
            <style>{pulseAnimation}</style>
            <h2>Painel de Alunos</h2>

            <div className="buscas">
                <div className="filters">
                    {['Todos', 'Alto risco', 'Médio risco', 'Baixo risco'].map(item => (
                        <button
                            key={item}
                            onClick={() => {
                                setFiltro(item);
                                navigate(item === 'Todos' ? '/alunos' : `/alunos?filtro=${encodeURIComponent(item)}`);
                            }}
                            className={filtro === item ? 'active' : ''}
                        >
                            {item}
                        </button>
                    ))}
                </div>

                <div class="group">
                    <svg viewBox="0 0 24 24" aria-hidden="true" class="search-icon">
                        <g>
                            <path
                                d="M21.53 20.47l-3.66-3.66C19.195 15.24 20 13.214 20 11c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9c2.215 0 4.24-.804 5.808-2.13l3.66 3.66c.147.146.34.22.53.22s.385-.073.53-.22c.295-.293.295-.767.002-1.06zM3.5 11c0-4.135 3.365-7.5 7.5-7.5s7.5 3.365 7.5 7.5-3.365 7.5-7.5 7.5-7.5-3.365-7.5-7.5z"
                            ></path>
                        </g>
                    </svg>

                    <input
                        id="query"
                        class="input"
                        type="search"
                        placeholder="Pesquisar alunos..."
                        name="searchbar"
                        value={busca}
                        onChange={e => setBusca(e.target.value)}
                    />
                </div>
            </div>

            <table className="studentsTable">
                <thead>
                    <tr>
                        <th>Aluno</th>
                        <th>Curso</th>
                        <th>Último acesso</th>
                        <th>Participação</th>
                        <th>Média</th>
                        <th>Pendentes</th>
                        <th>Risco</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {alunosFiltrados.map((aluno) => (
                        <tr key={aluno.user_id}>
                            <td>
                                <ContentOrPlaceholder isLoading={loadingItems[aluno.user_id]}>
                                    <div className="studentInfo">
                                        <strong>{aluno.name}</strong>
                                        <small>{aluno.email}</small>
                                    </div>
                                </ContentOrPlaceholder>
                            </td>
                            <td>
                                <ContentOrPlaceholder isLoading={loadingItems[aluno.user_id]}>
                                    {aluno.curso}
                                </ContentOrPlaceholder>
                            </td>
                            <td>
                                <ContentOrPlaceholder isLoading={loadingItems[aluno.user_id]}>
                                    {new Date(aluno.user_lastaccess).toLocaleDateString()}
                                </ContentOrPlaceholder>
                            </td>
                            <td>
                                <ContentOrPlaceholder isLoading={loadingItems[aluno.user_id]}>
                                    <div className="participationBar">
                                        <div className="bar" style={{ width: `${aluno.participacao}%` }}></div>
                                    </div>
                                    <small>{aluno.participacao}%</small>
                                </ContentOrPlaceholder>
                            </td>
                            <td>
                                <ContentOrPlaceholder isLoading={loadingItems[aluno.user_id]}>
                                    {aluno.media}
                                </ContentOrPlaceholder>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                                <ContentOrPlaceholder isLoading={loadingItems[aluno.user_id]}>
                                    <span className="pendingBadge">{aluno.pendentes}</span>
                                </ContentOrPlaceholder>
                            </td>
                            <td>
                                <ContentOrPlaceholder isLoading={loadingItems[aluno.user_id]}>
                                    <span className={`riskBadge ${String(aluno.risco).includes('Alto') ? 'high' :
                                        String(aluno.risco).includes('Médio') ? 'medium' :
                                            String(aluno.risco).includes('Baixo') ? 'low' : 'unknown'
                                        }`}>
                                        {aluno.risco || 'Desconhecido'}
                                    </span>
                                </ContentOrPlaceholder>
                            </td>
                            <td>
                                <ContentOrPlaceholder isLoading={loadingItems[aluno.user_id]}>
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
        </div>
    );

};

const thStyle = {
    textAlign: 'left',
    padding: '0.5rem',
    borderBottom: '2px solid #ccc'
};

const tdStyle = {
    padding: '0.5rem',
    verticalAlign: 'middle'
};

export default Alunos;
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import Spiner from '../../Components/Spiner/Spiner';

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

    if (loading) return <div className='spiner'><Spiner /> Buscando dados....</div>;


    return (
        <div style={{ padding: '1rem' }}>
            <style>{pulseAnimation}</style>

            <h2 style={{ marginBottom: '1rem' }}>Alunos</h2>

            <input
                type="text"
                placeholder="Buscar alunos..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                style={{
                    padding: '0.5rem',
                    width: '300px',
                    marginBottom: '1rem',
                    border: '1px solid #ccc',
                    borderRadius: '6px'
                }}
            />

            <div style={{ marginBottom: '1rem' }}>
                {['Todos', 'Alto risco', 'Médio risco', 'Baixo risco'].map(item => (
                    <button
                        key={item}
                        onClick={() => {
                            setFiltro(item);
                            navigate(item === 'Todos' ? '/alunos' : `/alunos?filtro=${encodeURIComponent(item)}`);
                        }}
                        style={{
                            marginRight: '0.5rem',
                            backgroundColor: filtro === item ? '#dceeff' : '#f1f1f1',
                            border: '1px solid #ccc',
                            borderRadius: '6px',
                            padding: '0.4rem 1rem',
                            cursor: 'pointer',
                            fontWeight: filtro === item ? 'bold' : 'normal'
                        }}
                    >
                        {item}
                    </button>
                ))}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                <thead>
                    <tr style={{ background: '#f9f9f9' }}>
                        <th style={thStyle}>Aluno</th>
                        <th style={thStyle}>Curso</th>
                        <th style={thStyle}>Último acesso</th>
                        <th style={thStyle}>Participação</th>
                        <th style={thStyle}>Média</th>
                        <th style={thStyle}>Pendentes</th>
                        <th style={thStyle}>Risco</th>
                        <th style={thStyle}>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {alunosFiltrados.map((aluno) => (
                        <tr key={aluno.user_id} style={{ borderBottom: '1px solid #ddd' }}>
                            <td style={tdStyle}>
                                <ContentOrPlaceholder isLoading={loadingItems[aluno.user_id]}>
                                    <>
                                        <strong>{aluno.name}</strong><br />
                                        <small>{aluno.email}</small>
                                    </>
                                </ContentOrPlaceholder>
                            </td>
                            <td style={tdStyle}>
                                <ContentOrPlaceholder isLoading={loadingItems[aluno.user_id]}>
                                    {aluno.curso}
                                </ContentOrPlaceholder>
                            </td>
                            <td style={tdStyle}>
                                <ContentOrPlaceholder isLoading={loadingItems[aluno.user_id]}>
                                    {new Date(aluno.user_lastaccess).toLocaleDateString()}
                                </ContentOrPlaceholder>
                            </td>
                            <td style={tdStyle}>
                                <ContentOrPlaceholder isLoading={loadingItems[aluno.user_id]}>
                                    <div style={{ width: '100px', background: '#eee', borderRadius: '4px' }}>
                                        <div style={{
                                            width: `${aluno.participacao}%`,
                                            background: '#333',
                                            height: '8px',
                                            borderRadius: '4px'
                                        }}></div>
                                    </div>
                                    <small>{aluno.participacao}%</small>
                                </ContentOrPlaceholder>
                            </td>
                            <td style={tdStyle}>
                                <ContentOrPlaceholder isLoading={loadingItems[aluno.user_id]}>
                                    {aluno.media}
                                </ContentOrPlaceholder>
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                                <ContentOrPlaceholder isLoading={loadingItems[aluno.user_id]}>
                                    <span style={{
                                        background: '#e0f7e0',
                                        padding: '2px 8px',
                                        borderRadius: '8px',
                                        fontSize: '0.8rem'
                                    }}>{aluno.pendentes}</span>
                                </ContentOrPlaceholder>
                            </td>
                            <td style={tdStyle}>
                                <ContentOrPlaceholder isLoading={loadingItems[aluno.user_id]}>
                                    <span style={{
                                        backgroundColor: riscoCor[aluno.risco.split(' ')[0]] || '#999',
                                        color: '#fff',
                                        padding: '2px 8px',
                                        borderRadius: '8px',
                                        fontSize: '0.8rem'
                                    }}>
                                        {aluno.risco}
                                    </span>
                                </ContentOrPlaceholder>
                            </td>
                            <td style={tdStyle}>
                                <ContentOrPlaceholder isLoading={loadingItems[aluno.user_id]}>
                                    <button
                                        onClick={() => irParaPerfil(aluno)}
                                        style={{
                                            padding: '0.25rem 0.5rem',
                                            backgroundColor: '#007bff',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer'
                                        }}
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
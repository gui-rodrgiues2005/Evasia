import React, {useState, useEffect} from 'react';
import {Link} from 'react-router-dom';
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

                    return {...user, risco};
                });

                setUsuarios(alunosComRisco);
                setTotalAlunos(alunosComRisco.length);

                let riscoAlto = 0, riscoMedio = 0, riscoBaixo = 0;
                alunosComRisco.forEach(user => {
                    if (user.risco === 'Alto risco') riscoAlto++;
                    else if (user.risco === 'Médio risco') riscoMedio++;
                    else if (user.risco === 'Baixo risco') riscoBaixo++;
                });

                setAlunosPorRisco({alto: riscoAlto, medio: riscoMedio, baixo: riscoBaixo});
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
                const promessas = alunosValidos.map(async (user) => {
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

                const modulosEsperados = extrairModulosDeMaiorParticipante(logsUsuarios);
                let somaNotas = 0;

                const novosAlunos = alunosValidos.map(aluno => {
                    const logs = logsUsuarios.find(l => l.userId === aluno.user_id)?.logs ?? [];
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
                    const risco = riscoCompleto.includes('Alto') ? 'Alto' :
                        riscoCompleto.includes('Médio') ? 'Médio' :
                            riscoCompleto.includes('Baixo') ? 'Baixo' : 'Desconhecido';

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
                setAlunos(novosAlunos);
                setAlunosValidos(novosAlunos);
                setTotalAcoes(logsUsuarios.reduce((acc, curr) => acc + curr.logs.length, 0));
                setMediaNotas(mediaGeral);
            } catch (err) {
                console.error('Erro ao buscar logs:', err);
            } finally {
                setLoadingLogs(false);
            }
        };

        buscarLogs();
    }, [alunosValidos]);

    const riscoCor = {
        'Alto': 'red',
        'Médio': '#f5a623',
        'Baixo': 'green'
    };

    const alunosFiltrados = alunosValidos.filter(aluno => {
        const matchBusca = aluno.name.toLowerCase().includes(busca.toLowerCase());
        const matchFiltro = filtro === 'Todos' || aluno.risco === filtro;
        return matchBusca && matchFiltro;
    });

    if (loading) return <div className='spiner'><Spiner/> Buscando dados....</div>;

    return (
        <div style={{padding: '1rem'}}>
            <h2 style={{marginBottom: '1rem'}}>Alunos</h2>

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

            <div style={{marginBottom: '1rem'}}>
                {['Todos', 'Alto', 'Médio', 'Baixo'].map(item => (
                    <button
                        key={item}
                        onClick={() => setFiltro(item)}
                        style={{
                            marginRight: '0.5rem',
                            backgroundColor: filtro === item ? '#dceeff' : '#f1f1f1',
                            border: '1px solid #ccc',
                            borderRadius: '6px',
                            padding: '0.4rem 1rem',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        {item === 'Alto' ? 'Alto Risco' :
                            item === 'Médio' ? 'Médio Risco' :
                                item === 'Baixo' ? 'Baixo Risco' : 'Todos'}
                    </button>
                ))}
            </div>

            <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem'}}>
                <thead>
                <tr style={{background: '#f9f9f9'}}>
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
                    <tr key={aluno.user_id} style={{borderBottom: '1px solid #ddd'}}>
                        <td style={tdStyle}>
                            <strong>{aluno.name}</strong><br/>
                            <small>{aluno.email}</small>
                        </td>
                        <td style={tdStyle}>{aluno.curso}</td>
                        <td style={tdStyle}>{new Date(aluno.user_lastaccess).toLocaleDateString()}</td>
                        <td style={tdStyle}>
                            <div style={{width: '100px', background: '#eee', borderRadius: '4px'}}>
                                <div style={{
                                    width: `${aluno.participacao}%`,
                                    background: '#333',
                                    height: '8px',
                                    borderRadius: '4px'
                                }}></div>
                            </div>
                            <small>{aluno.participacao}%</small>
                        </td>
                        <td style={tdStyle}>{aluno.media}</td>
                        <td style={{...tdStyle, textAlign: 'center'}}>
                                <span style={{
                                    background: '#e0f7e0',
                                    padding: '2px 8px',
                                    borderRadius: '8px',
                                    fontSize: '0.8rem'
                                }}>{aluno.pendentes}</span>
                        </td>
                        <td style={tdStyle}>
                                <span style={{
                                    backgroundColor: riscoCor[aluno.risco],
                                    color: '#fff',
                                    padding: '2px 8px',
                                    borderRadius: '8px',
                                    fontSize: '0.8rem'
                                }}>{aluno.risco}</span>
                        </td>
                        <td style={tdStyle}>
                            <Link
                                to={`/perfil-aluno/${aluno.user_id}`}
                                style={{
                                    textDecoration: 'none',
                                    color: 'black',
                                    cursor: 'pointer',
                                    padding: '4px 8px',
                                    border: '1px solid #ccc',
                                    borderRadius: '6px',
                                    fontWeight: 'bold'
                                }}
                            >
                                Ver
                            </Link>
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

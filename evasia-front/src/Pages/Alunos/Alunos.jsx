import React, {useState, useEffect} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import Spiner from '../../Components/Spiner/Spiner'

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

    useEffect(() => {
        fetch('http://localhost:5164/api/User')
            .then(response => response.json())
            .then(data => {
                // 1. Filtrar somente os alunos válidos
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

                // 2. Calcular risco apenas dos válidos
                const alunosComRisco = alunosFiltrados.map(user => {
                    const riscoCompleto = calcularRisco(user);
                    const risco = riscoCompleto.includes('Alto') ? 'Alto' :
                        riscoCompleto.includes('Médio') ? 'Médio' :
                            riscoCompleto.includes('Baixo') ? 'Baixo' : 'Desconhecido';

                    return {...user, risco};
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
                // Buscar logs de todos os alunos
                const promessas = alunosValidos.map(async (user) => {
                    const res = await fetch('http://localhost:5164/api/LogsUsuario/logs', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify(user.user_id)
                    });
                    const dados = await res.json();
                    return { userId: user.user_id, logs: dados };
                });

                const logsUsuarios = await Promise.all(promessas);
                setLogs(logsUsuarios);

                let somaNotas = 0;

                const novosAlunos = alunosValidos.map(aluno => {
                    const logs = logsUsuarios.find(l => l.userId === aluno.user_id)?.logs ?? [];
                    const interacoes = filtrarInteracoesValidas(logs);
                    const participacao = calcularParticipacao(interacoes);
                    const nota = calcularNotaAluno(logs);

                    somaNotas += nota;

                    // LOG INDIVIDUAL
                    console.log(`\n[Aluno: ${aluno.name}]`);
                    console.log(`→ Total de logs: ${logs.length}`);
                    console.log(`→ Interações válidas: ${interacoes.length}`);
                    console.log(`→ Participação: ${participacao}%`);
                    console.log(`→ Nota média: ${nota.toFixed(1)}\n`);

                    return {
                        ...aluno,
                        participacao,
                        media: nota.toFixed,
                        pendentes: 3, // valor fixo por enquanto
                        ultimosAcessos: interacoes.map(i => i.date),
                    };
                });

                setAlunos(novosAlunos);
                setAlunosValidos(novosAlunos);

                const totalAcoes = logsUsuarios.reduce((acc, curr) => acc + curr.logs.length, 0);
                setTotalAcoes(totalAcoes);

                const mediaNotas = (somaNotas / logsUsuarios.length).toFixed(1);
                setMediaNotas(mediaNotas);

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

    const calcularNotaAluno = (logs) => {
        const logsComNota = logs.filter(l => l.grade !== null && l.grade !== undefined);
        if (logsComNota.length === 0) return 0;

        const soma = logsComNota.reduce((acc, curr) => acc + parseFloat(curr.grade), 0);
        return soma / logsComNota.length;
    };

    const alunosFiltrados = alunosValidos.filter(aluno => {
        const matchBusca = aluno.name.toLowerCase().includes(busca.toLowerCase());
        const matchFiltro = filtro === 'Todos' || aluno.risco === filtro;
        return matchBusca && matchFiltro;
    });

    if (loading) return <div className='spiner'><Spiner/> Buscando dados....</div>
    return (
        <div style={{padding: '1rem'}}>
            <h2 style={{marginBottom: '1rem'}}>Alunos</h2>

            {/* Campo de busca */}
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

            {/* Filtros */}
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

            {/* Tabela */}
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
                {alunosFiltrados.map((aluno, index) => (
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

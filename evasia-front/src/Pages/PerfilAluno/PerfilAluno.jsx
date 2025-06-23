import { useState, useEffect } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import PerfilHeader from '../../Components/compomentesPerfilAluno/PerfilHeader/PerfilHeader';
import MetricasAluno from '../../Components/compomentesPerfilAluno/MetricaAluno/MetricaAluno';
import ResumoStatus from '../../Components/compomentesPerfilAluno/ResumoStatus/ResumoStatus';
import UltimoAcesso from '../../Components/compomentesPerfilAluno/UltimoAcesso/UltimoAcesso';
import EvolucaoAluno from '../../Components/compomentesPerfilAluno/EvolucaoAluno/EvolucaoAluno';
import AnaliseTendencia from '../../Components/compomentesPerfilAluno/AnaliseTendencia/AnaliseTendencia';
import Evasao from '../../Components/compomentesPerfilAluno/Evasao/Evasao';
import './PerfilAluno.scss';

const totalEsperado = 50;
const targetsValidos = [
    "course",
    "user_list",
    "user_profile",
    "grade_report",
    "user_report"
];

function filtrarInteracoesValidas(logs) {
    return logs.filter(log => log.action === "viewed" && targetsValidos.includes(log.target));
}

function calcularParticipacao(logs) {
    const interacoes = filtrarInteracoesValidas(logs);
    return Math.min(100, Math.floor((interacoes.length / totalEsperado) * 100));
}

function calcularMediaComposta(logs) {
    const totalEsperado = 50;
    const targetsValidos = [
        "course",
        "user_list",
        "user_profile",
        "grade_report",
        "user_report"
    ];

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

    return nota.toFixed(1);
}

function calcularConclusao(logs) {
    const modulosTotais = logs.filter(l => l.target === 'course_module');
    const modulosAcessados = modulosTotais.filter(l => l.action === 'viewed');
    const total = modulosTotais.length;
    const acessados = modulosAcessados.length;
    return total === 0 ? 0 : Math.round((acessados / total) * 100);
}

function calcularRisco(aluno, participacao = 0, media = 10) {
    const hoje = new Date();
    const lastAccess = new Date(aluno.user_lastaccess);
    const diffDias = (hoje - lastAccess) / (1000 * 60 * 60 * 24);

    if (participacao < 40 && media < 6) return 'Alto risco';
    if (participacao < 40 || media < 6) return 'Alto risco';
    if (participacao >= 50 && diffDias <= 15 && media >= 6) return 'Baixo risco';
    if (participacao < 60 || diffDias > 15 || media < 6.5) return 'Médio risco';
    return 'Baixo risco';
}

function calcularAtividadesPendentes(logs) {
    const modulosTotais = logs.filter(l => l.target === 'course_module');
    const modulosAcessados = modulosTotais.filter(l => l.action === 'viewed');
    const pendentes = modulosTotais.length - modulosAcessados.length;
    return pendentes > 0 ? pendentes : 0;
}


const PerfilAluno = () => {
    const [logsAluno, setLogsAluno] = useState([]);
    const [name, setName] = useState('');
    const [materia, setMateria] = useState('');
    const [participacao, setParticipacao] = useState(0);
    const [atividadesPendentes, setAtividadesPendentes] = useState(0);
    const [media, setMedia] = useState(null);
    const [conclusao, setConclusao] = useState(0);
    const { user_id } = useParams();
    const location = useLocation();
    const aluno = location.state?.aluno;

    useEffect(() => {
        if (!aluno) {
            return;
        }
        axios
            .post(`http://localhost:5164/api/LogsUsuario/logs-batch`, [user_id], {
                headers: {
                    'Content-Type': 'application/json',
                },
            })
            .then((response) => {
                const resultado = response.data && response.data[0];
                const logs = resultado?.logs || [];
                setLogsAluno(logs);

                if (logs.length > 0) {
                    setParticipacao(calcularParticipacao(logs));
                    setConclusao(calcularConclusao(logs));
                    setMedia(calcularMediaComposta(logs));
                    setAtividadesPendentes(calcularAtividadesPendentes(logs));
                    setName(logs[0].name);
                    setMateria(logs[0].course_fullname);
                } else {
                    setParticipacao(calcularParticipacao(logs));
                    setConclusao(calcularConclusao(logs));
                    setMedia(calcularMediaComposta(logs));
                    setAtividadesPendentes(0);
                    setName('');
                    setMateria('');
                }
            })
            .catch((error) => {
                console.error('Erro ao buscar os logs do aluno:', error);
            });
    }, [user_id, aluno]);


    return (
        <div className="perfil-container" style={{ padding: '20px', fontFamily: 'Arial' }}>
            <div style={{ marginBottom: '20px' }}>
                <Link
                    to="/alunos"
                    style={{ textDecoration: 'none', color: '#007bff', fontWeight: 'bold' }}
                >
                    ← Voltar para a lista de alunos
                </Link>
            </div>

            <div style={{ display: 'flex', gap: '20px' }}>
                {/* Coluna da Esquerda */}
                <div style={{ flex: 2 }}>
                    <PerfilHeader name={name} materia={materia} />
                    <MetricasAluno participacao={participacao} media={media} />
                    <ResumoStatus
                        atividadesPendentes={aluno?.pendentes}
                        userLastAccess={aluno?.user_lastaccess}
                        risco={aluno?.risco}
                    />
                    {logsAluno.length > 0 && <Evasao risco={calcularRisco(aluno, participacao, media)} />}
                    <UltimoAcesso userLastAccess={aluno?.user_lastaccess} />
                </div>

                {/* Coluna da Direita */}
                <div style={{ flex: 1 }}>
                    <EvolucaoAluno logs={logsAluno} />
                    <AnaliseTendencia logs={logsAluno} />
                </div>
            </div>
        </div>
    );
};

export default PerfilAluno;
import {Link, useNavigate} from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, Cell } from 'recharts';


const GraficoRisco = ({quantidade}) => {
    const navigate = useNavigate();
    const dataRisco = [
        { nivel: 'Alto Risco', alunos: quantidade.alto|| 0, cor: '#e53935' },
        { nivel: 'Risco Médio', alunos: quantidade.medio || 0, cor: '#fbc02d' },
        { nivel: 'Baixo Risco', alunos: quantidade.baixo || 0, cor: '#43a047' },
    ];

    return (
        <div style={{ width: '100%', height: 250 }}>
            <h3>Alunos em Risco</h3>
            <p>Distribuição por nível de risco</p>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataRisco} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="nivel" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="alunos" isAnimationActive={false}>
                        <LabelList dataKey="alunos" position="right" />
                        {dataRisco.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.cor}
                                cursor="pointer"
                                onClick={() => navigate(`/alunos?risco=${entry.nome}`)}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
            <Link
                to={"/alunos"}
                style={{
                    display: 'block',
                    textAlign: 'center',
                    textDecoration: 'none',
                    color: '#007bff',
                    fontWeight: '500',
                    marginTop: '1rem',
                    cursor: 'pointer',
                    transition: 'color 0.3s'
                }}
                onMouseOver={e => e.currentTarget.style.color = '#0056b3'}
                onMouseOut={e => e.currentTarget.style.color = '#007bff'}
            >
                Ver todos os alunos
            </Link>
        </div>
    );
};

export default GraficoRisco;

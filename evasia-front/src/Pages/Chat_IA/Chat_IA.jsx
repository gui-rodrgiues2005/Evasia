import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Json from '../../utils/respostasGerais.json';
import './Chat_IA.scss';

const respostasGerais = Json.map(item => ({
  pergunta: new RegExp(item.pergunta, 'i'),
  resposta: item.resposta
}));

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

function normalizarNome(nome) {
  return nome?.toString().trim().toLowerCase().replace(/\s+/g, '');
}

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

function calcularRisco(aluno, participacao = 0, media = 10, diasDesdeUltimoAcesso = 0) {
  if (diasDesdeUltimoAcesso > 7) return 'ALTO';
  if (participacao < 40 && media < 6) return 'ALTO';
  if (participacao < 40 || media < 6) return 'ALTO';
  if (participacao >= 50 && diasDesdeUltimoAcesso <= 3 && media >= 6) return 'BAIXO';
  if (participacao < 60 || diasDesdeUltimoAcesso > 3 || media < 6.5) return 'MÉDIO';
  return 'BAIXO';
}

const prioridadeTraduzida = {
  urgent: "urgente",
  moderate: "moderada",
  low: "baixa",
  routine: "rotineira"
};

const ChatIA = () => {
  const { user_id } = useParams();
  const [aiResponse, setAiResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [chat, setChat] = useState([
    { sender: 'ia', text: 'Olá! Sou a IA de apoio. Você pode fazer perguntas sobre evasão ou digitar o nome de um aluno para análise.' }
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (user_id) {
      // Busca análise detalhada automaticamente
      (async () => {
        setLoading(true);
        setShowAnalysis(false);
        try {
          const analiseRes = await fetch(`http://localhost:5164/api/Alerts/get-ai-response/${user_id}`);
          if (analiseRes.ok) {
            const dados = await analiseRes.json();
            setAiResponse(typeof dados === 'string' ? JSON.parse(dados) : dados);
            setShowAnalysis(true);
            setChat(prev => [
              ...prev,
              { sender: 'ia', text: `Aqui está a análise detalhada do aluno selecionado.` }
            ]);
          }
        } catch (e) {
          setChat(prev => [
            ...prev,
            { sender: 'ia', text: `Ocorreu um erro ao buscar os dados do aluno selecionado.` }
          ]);
        }
        setLoading(false);
      })();
    }
    // eslint-disable-next-line
  }, [user_id]);

  // Função para buscar e analisar aluno pelo nome (usando as novas lógicas)
  const buscarAnalisePorNome = async (nomeAluno) => {
    setLoading(true);
    setChat(prev => [
      ...prev,
      { sender: 'ia', text: `Buscando análise detalhada para "${nomeAluno}"...` }
    ]);
    try {
      const res = await fetch(`http://localhost:5164/api/User`);
      const alunos = await res.json();

      // Busca flexível
      const normalizar = str => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
      const aluno = alunos.find(a => normalizar(a.name).includes(normalizar(nomeAluno)));

      if (!aluno) {
        setChat(prev => [
          ...prev,
          { sender: 'ia', text: 'Desculpa, não entendi, reescreva por favor !' }
        ]);
        setLoading(false);
        return;
      }

      // Busca logs do aluno
      const logsRes = await fetch('http://localhost:5164/api/LogsUsuario/logs-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([aluno.user_id])
      });
      const resultados = await logsRes.json();
      const logs = resultados.find(r => r.userId === aluno.user_id)?.logs ?? [];

      // Cálculos reais
      const participacao = calcularParticipacao(logs);
      const media = calcularNota(logs);
      const cobertura = calcularCoberturaDeModulos(logs);
      const pendentes = 0; // Ajuste se tiver lógica para atividades pendentes

      const ultimoAcesso = aluno.user_lastaccess ? new Date(aluno.user_lastaccess) : new Date();
      const diasDesdeUltimoAcesso = Math.floor((Date.now() - ultimoAcesso.getTime()) / (1000 * 60 * 60 * 24));
      let access_frequency = "regular";
      if (diasDesdeUltimoAcesso > 7) access_frequency = "raro";
      else if (diasDesdeUltimoAcesso > 3) access_frequency = "irregular";

      const risco = calcularRisco(aluno, participacao, media, diasDesdeUltimoAcesso);

      const riskFactors = [];
      if (access_frequency !== "regular") riskFactors.push("acessos irregulares");
      if (media < 6) riskFactors.push("nota abaixo da média");
      if (participacao < 40) riskFactors.push("baixa participação");
      if (pendentes > 0) riskFactors.push("atividades pendentes");

      const protectiveFactors = [];
      if (participacao > 70) protectiveFactors.push("participação ativa");
      if (media >= 7) protectiveFactors.push("boas notas");
      if (cobertura > 60) protectiveFactors.push("bom progresso no curso");

      let immediate = [], followUp = [], priority = "routine";
      if (risco === "ALTO") {
        immediate = ["contatar aluno via e-mail", "agendar tutoria"];
        followUp = ["monitorar acessos próximos 7 dias"];
        priority = "urgent";
      } else if (risco === "MÉDIO") {
        immediate = ["enviar lembrete de atividades"];
        followUp = ["avaliar progresso em 1 semana"];
        priority = "moderate";
      }

      const risk_score = Math.round((100 - diasDesdeUltimoAcesso) * 0.3 + participacao * 0.3 + media * 10 * 0.4);

      const dadosParaIA = {
        user_id: aluno.user_id,
        student_name: aluno.name,
        course_info: aluno.curso || "Curso desconhecido",
        last_access_analysis: {
          last_access_date: ultimoAcesso.toISOString(),
          days_since_access: diasDesdeUltimoAcesso,
          access_frequency
        },
        academic_status: {
          course_progress: `${cobertura}%`,
          current_grades: media.toFixed(1),
          assignments_status: pendentes > 0 ? "atrasado" : "em dia"
        },
        risk_assessment: {
          risk_level: risco,
          risk_score,
          confidence: 87,
          primary_risk_factors: riskFactors,
          protective_factors: protectiveFactors
        },
        recommendations: {
          immediate_actions: immediate,
          follow_up_actions: followUp,
          contact_priority: priority
        },
        analysis_metadata: {
          analyzed_at: new Date().toISOString(),
          data_source: "UNIFENAS API",
          analyst: "AI Sistema Detecção Evasão"
        }
      };

      const response = await fetch("http://localhost:5164/api/Alerts/receive-ai-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(JSON.stringify(dadosParaIA))
      });


      if (response.headers.get("content-length") !== "0") {
        const result = await response.json();
        if (result.userId) {
          // Busca análise detalhada para exibir
          const analiseRes = await fetch(`http://localhost:5164/api/Alerts/get-ai-response/${result.userId}`);
          if (analiseRes.ok) {
            const dados = await analiseRes.json();
            setAiResponse(typeof dados === 'string' ? JSON.parse(dados) : dados);
            setShowAnalysis(true);
            setChat(prev => [
              ...prev,
              { sender: 'ia', text: `Aqui está a análise detalhada do aluno "${aluno.name}".` }
            ]);
          }
        }
      }
    } catch (e) {
      setChat(prev => [
        ...prev,
        { sender: 'ia', text: `Ocorreu um erro ao buscar os dados do aluno.` }
      ]);
    }
    setLoading(false);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  // Função para processar mensagens
  const sendMessage = async () => {
    if (!input.trim()) return;
    setSending(true);
    const mensagem = input.trim();
    setChat(prev => [...prev, { sender: 'prof', text: mensagem }]);
    setInput('');

    // 1. Verifica se é uma pergunta geral
    const respostaGeral = respostasGerais.find(r => r.pergunta.test(mensagem));
    if (respostaGeral) {
      setTimeout(() => {
        setChat(prev => [
          ...prev,
          { sender: 'ia', text: respostaGeral.resposta }
        ]);
        setSending(false);
      }, 1000);
      return;
    }

    if (
      mensagem.split(' ').length >= 2 &&
      mensagem.length > 6 &&
      !mensagem.trim().endsWith('?')
    ) {
      await buscarAnalisePorNome(mensagem);
      setSending(false);
      return;
    }

    // 3. Resposta padrão
    setTimeout(() => {
      setChat(prev => [
        ...prev,
        { sender: 'ia', text: 'Posso responder dúvidas sobre evasão ou analisar um aluno. Digite uma pergunta ou o nome completo de um aluno para análise.' }
      ]);
      setSending(false);
    }, 1000);
  };

  const riscoColor = {
    'ALTO': 'alto',
    'MÉDIO': 'medio',
    'BAIXO': 'baixo'
  };

  return (
    <div className="chatia-container">
      <div className="chatia-main-row">
        {/* Coluna da análise detalhada, só aparece se showAnalysis for true */}
        <div className="chatia-analysis-col">
          {showAnalysis && aiResponse && !loading && (
            <>
              <h2 className="chatia-title">Análise Detalhada da IA</h2>
              <p className="chatia-desc">Veja o diagnóstico e converse com a IA sobre o aluno.</p>
              <div className="chatia-cards">
                <div className="chatia-card">
                  <div className="chatia-card-label">Aluno</div>
                  <div className="chatia-card-main">{aiResponse.student_name}</div>
                  <div className="chatia-card-sub">{aiResponse.course_info}</div>
                </div>
                <div className="chatia-card">
                  <div className="chatia-card-label">Último acesso</div>
                  <div className="chatia-card-main">
                    {aiResponse.last_access_analysis?.days_since_access} dias atrás
                  </div>
                  <div className="chatia-card-sub">
                    {aiResponse.last_access_analysis?.last_access_date?.split('T')[0]} ({aiResponse.last_access_analysis?.access_frequency})
                  </div>
                </div>
                <div className="chatia-card">
                  <div className="chatia-card-label">Nível de risco</div>
                  <div className={`chatia-card-main chatia-risco ${riscoColor[aiResponse.risk_assessment?.risk_level] || ''}`}>
                    {aiResponse.risk_assessment?.risk_level}
                  </div>
                  <div className="chatia-card-sub">
                    Score: {aiResponse.risk_assessment?.risk_score} | Confiança: {aiResponse.risk_assessment?.confidence}%
                  </div>
                </div>
              </div>
              <div className="chatia-row">
                <div className="chatia-col">
                  <h3 className="chatia-section-title">Fatores de risco</h3>
                  <ul className="chatia-list">
                    {(aiResponse.risk_assessment?.primary_risk_factors || []).length > 0
                      ? aiResponse.risk_assessment.primary_risk_factors.map((f, i) => (
                        <li key={i} className="chatia-risk">{f}</li>
                      ))
                      : <li className="chatia-risk">Nenhum fator de risco identificado.</li>
                    }
                  </ul>
                  <h3 className="chatia-section-title">Fatores protetivos</h3>
                  <ul className="chatia-list">
                    {(aiResponse.risk_assessment?.protective_factors || []).map((f, i) => (
                      <li key={i} className="chatia-protect">{f}</li>
                    ))
                      .length === 0 && <li className="chatia-protect">Nenhum fator protetivo identificado.</li>
                    }
                  </ul>
                </div>
                <div className="chatia-col">
                  <h3 className="chatia-section-title">Recomendações da IA</h3>
                  <ul className="chatia-list">
                    <li><strong>Ações imediatas:</strong> {(aiResponse.recommendations?.immediate_actions || []).join(', ')}</li>
                    <li><strong>Acompanhamento:</strong> {(aiResponse.recommendations?.follow_up_actions || []).join(', ')}</li>
                    <li>
                      <strong>Prioridade de contato:</strong>{" "}
                      {prioridadeTraduzida[(aiResponse.recommendations?.contact_priority || '').toLowerCase()] || aiResponse.recommendations?.contact_priority || 'Não informado'}
                    </li>
                  </ul>
                </div>
              </div>
              <div className="chatia-historico">
                <h4>Histórico da análise</h4>
                <div className="chatia-historico-list">
                  <div><strong>Progresso no curso:</strong> {aiResponse.academic_status?.course_progress}</div>
                  <div><strong>Média atual:</strong> {aiResponse.academic_status?.current_grades}</div>
                  <div><strong>Status das atividades:</strong> {aiResponse.academic_status?.assignments_status}</div>
                  <div><strong>Analisado em:</strong> {aiResponse.analysis_metadata?.analyzed_at?.replace('T', ' ').slice(0, 19)}</div>
                  <div><strong>Fonte:</strong> {aiResponse.analysis_metadata?.data_source}</div>
                  <div><strong>Analista:</strong> {aiResponse.analysis_metadata?.analyst}</div>
                </div>
              </div>
            </>
          )}
          {loading && <div className="chatia-loading">Carregando análise...</div>}
        </div>

        {/* Coluna do chat — sempre visível */}
        <div className="chatia-chat-col">
          <div className="chatia-chatbox">
            <h3 className="chatia-section-title">Converse com a IA</h3>
            <div className="chatia-chat-messages">
              {chat.map((msg, idx) => (
                <div key={idx} className={`chatia-msg ${msg.sender}`}>
                  <div className="chatia-msg-bubble">{msg.text}</div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="chatia-chat-input-row">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Digite sua pergunta ou o nome de um aluno..."
                className="chatia-chat-input"
                onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
                disabled={sending}
              />
              <button
                onClick={sendMessage}
                disabled={sending || !input.trim()}
                className="chatia-chat-btn"
              >
                {sending ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default ChatIA;
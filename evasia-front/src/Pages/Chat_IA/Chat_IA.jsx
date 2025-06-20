import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import './Chat_IA.scss';

const respostasGerais = [
  {
    pergunta: /evadir|evasão|evitar/i,
    resposta: "Para evitar a evasão, é importante acompanhar o engajamento dos alunos, oferecer suporte personalizado, identificar sinais de risco precocemente e promover um ambiente acolhedor e motivador."
  },
  {
    pergunta: /como identificar.*risco/i,
    resposta: "Você pode identificar alunos em risco analisando frequência de acesso, participação em atividades, desempenho acadêmico e cumprimento de prazos."
  },
  {
    pergunta: /estratégia|estratégias/i,
    resposta: "Algumas estratégias incluem contato proativo, tutoria personalizada, feedback constante e incentivo à participação em fóruns e atividades."
  }
  // Adicione mais padrões conforme desejar
];

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

  // Função para buscar e analisar aluno pelo nome (igual à tela de alunos)
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

      // Monta dados para IA (igual tela de alunos)
      const user_id = aluno.user_id;
      const student_name = aluno.name;
      const course_info = aluno.curso || "Curso desconhecido";
      const ultimoAcesso = aluno.user_lastaccess ? new Date(aluno.user_lastaccess) : new Date();
      const diasDesdeUltimoAcesso = Math.floor((Date.now() - ultimoAcesso.getTime()) / (1000 * 60 * 60 * 24));
      const acessouUltimos7Dias = logs.some(log => {
        const logDate = new Date(log.date);
        return (Date.now() - logDate.getTime()) / (1000 * 60 * 60 * 24) <= 7;
      });
      const access_frequency = acessouUltimos7Dias ? "regular" : "irregular";

      // Simulação de cálculo de participação, média e pendentes
      const participacao = 80; // valor fictício, ajuste conforme sua lógica
      const media = 7.5; // valor fictício, ajuste conforme sua lógica
      const pendentes = 0; // valor fictício, ajuste conforme sua lógica

      // Simulação de risco
      let risco = 'Baixo risco';
      if (diasDesdeUltimoAcesso > 30) risco = 'Alto risco';
      else if (diasDesdeUltimoAcesso > 7) risco = 'Médio risco';

      const riskFactors = [];
      if (access_frequency === "irregular") riskFactors.push("acessos irregulares");
      if (media < 6) riskFactors.push("nota abaixo da média");
      if (pendentes > 0) riskFactors.push("atividades pendentes");

      const protectiveFactors = [];
      if (participacao > 70) protectiveFactors.push("participação ativa");
      if (media >= 7) protectiveFactors.push("boas notas");

      let immediate = [], followUp = [], priority = "low";
      if (risco === "Alto risco") {
        immediate = ["contatar aluno via e-mail", "agendar tutoria"];
        followUp = ["monitorar acessos próximos 7 dias"];
        priority = "high";
      } else if (risco === "Médio risco") {
        immediate = ["enviar lembrete de atividades"];
        followUp = ["avaliar progresso em 1 semana"];
        priority = "moderate";
      }

      const risk_score = Math.round((100 - diasDesdeUltimoAcesso) * 0.3 + participacao * 0.3 + media * 10 * 0.4);

      const dadosParaIA = {
        user_id,
        student_name,
        course_info,
        last_access_analysis: {
          last_access_date: ultimoAcesso.toISOString(),
          days_since_access: diasDesdeUltimoAcesso,
          access_frequency
        },
        academic_status: {
          course_progress: "45%",
          current_grades: media,
          assignments_status: pendentes > 0 ? "pendentes" : "em dia"
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
          data_source: "Chat IA",
          analyst: "Sistema Interno"
        }
      };

      // Envia para IA
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

    // 2. Tenta buscar aluno pelo nome (se for uma frase curta, assume que é nome)
    if (mensagem.split(' ').length >= 2 && mensagem.length > 6) {
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
    'Alto risco': 'alto',
    'Médio risco': 'medio',
    'Baixo risco': 'baixo'
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
                    {(aiResponse.risk_assessment?.primary_risk_factors || []).map((f, i) => (
                      <li key={i} className="chatia-risk">{f}</li>
                    ))}
                  </ul>
                  <h3 className="chatia-section-title">Fatores protetivos</h3>
                  <ul className="chatia-list">
                    {(aiResponse.risk_assessment?.protective_factors || []).map((f, i) => (
                      <li key={i} className="chatia-protect">{f}</li>
                    ))}
                  </ul>
                </div>
                <div className="chatia-col">
                  <h3 className="chatia-section-title">Recomendações da IA</h3>
                  <ul className="chatia-list">
                    <li><strong>Ações imediatas:</strong> {(aiResponse.recommendations?.immediate_actions || []).join(', ')}</li>
                    <li><strong>Acompanhamento:</strong> {(aiResponse.recommendations?.follow_up_actions || []).join(', ')}</li>
                    <li><strong>Prioridade de contato:</strong> {aiResponse.recommendations?.contact_priority}</li>
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
};

export default ChatIA;
using HackathonAPI.Services;
using HackathonAPI.Models; // Certifique que LogResponse está nesse namespace
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

public class AlunoService : IAlunoService
{
    private readonly IUnifenasApiService _unifenasApiService;

    public AlunoService(IUnifenasApiService unifenasApiService)
    {
        _unifenasApiService = unifenasApiService;
    }

    public async Task<object?> ObterDadosParaAnaliseAsync(string userId)
    {
        var usuarios = await _unifenasApiService.GetUsuarios();
        var logsPorUsuario = await _unifenasApiService.GetLogsByUserId(userId);

        var usuario = usuarios?.FirstOrDefault(u => u.user_id == userId);
        if (usuario == null || logsPorUsuario == null || logsPorUsuario.Count == 0)
            return null;

        // Pega o último log por data
        var ultimoLog = logsPorUsuario
            .OrderByDescending(l => DateTime.Parse(l.date))
            .First();

        DateTime ultimoAcesso = DateTime.TryParse(ultimoLog.user_lastaccess, out var dt) ? dt : DateTime.UtcNow;

        string cursoNome = !string.IsNullOrEmpty(ultimoLog.course_fullname) ? ultimoLog.course_fullname : "Curso desconhecido";

        // Monta o objeto para a IA
        var dadosParaAnalise = new
        {
            user_id = usuario.user_id,
            student_name = usuario.name,
            course_info = cursoNome,
            last_access_analysis = new
            {
                last_access_date = ultimoAcesso.ToString("o"),
                days_since_access = (DateTime.UtcNow - ultimoAcesso).Days,
                access_frequency = CalcularFrequenciaAcesso(logsPorUsuario)
            },
            academic_status = new
            {
                course_progress = "45%",    // Pode adaptar para dados reais
                current_grades = 6.3,
                assignments_status = "em dia"
            },
            risk_assessment = new
            {
                risk_level = "MÉDIO",
                risk_score = 58,
                confidence = 87,
                primary_risk_factors = new string[] { "acessos irregulares", "nota abaixo da média" },
                protective_factors = new string[] { "participa de fóruns", "entrega tarefas" }
            },
            recommendations = new
            {
                immediate_actions = new string[] { "contatar aluno via e-mail", "agendar tutoria" },
                follow_up_actions = new string[] { "monitorar acessos próximos 7 dias" },
                contact_priority = "moderate"
            },
            analysis_metadata = new
            {
                analyzed_at = DateTime.UtcNow.ToString("o"),
                data_source = "UNIFENAS API",
                analyst = "Sistema Interno"
            }
        };

        return dadosParaAnalise;
    }

    // Função para calcular frequência de acesso com base nos logs
    private string CalcularFrequenciaAcesso(List<LogResponse> logs)
    {
        // Verifica se existe pelo menos um acesso nos últimos 7 dias
        DateTime agora = DateTime.UtcNow;
        bool acessouUltimos7Dias = logs.Any(log =>
        {
            if (DateTime.TryParse(log.date, out var dataLog))
            {
                return (agora - dataLog).TotalDays <= 7;
            }
            return false;
        });

        return acessouUltimos7Dias ? "regular" : "irregular";
    }
}

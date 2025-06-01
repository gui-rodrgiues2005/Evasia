using HackathonAPI.Models;
using Microsoft.AspNetCore.Mvc;

namespace HackathonAPI.Controllers
{
    [ApiController]
    [Route("api/alerts")]
    public class AlertsController : ControllerBase
    {
        [HttpPost("urgent")]
        public async Task<IActionResult> ReceiveUrgentAlert([FromBody] DropoutAlert alert)
        {
            // Aqui você pode registrar o alerta, enviar notificações, etc.
            Console.WriteLine($"[ALERTA URGENTE] Aluno: {alert.Student.Name} - Risco: {alert.RiskData.Level}");

            return Ok(new { message = "Alerta urgente recebido com sucesso." });
        }

        [HttpPost("moderate")]
        public async Task<IActionResult> ReceiveModerateAlert([FromBody] DropoutAlert alert)
        {
            Console.WriteLine($"[ALERTA MODERADO] Aluno: {alert.Student.Name} - Risco: {alert.RiskData.Level}");

            return Ok(new { message = "Alerta moderado recebido com sucesso." });
        }
    }
}

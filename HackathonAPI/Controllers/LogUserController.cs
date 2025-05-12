using HackathonAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using System.Net.Http.Headers;
using System.Text;

[ApiController]
[Route("api/[controller]")]
public class LogsUsuarioController : ControllerBase
{
    private readonly HttpClient _httpClient;

    public LogsUsuarioController(IHttpClientFactory httpClientFactory)
    {
        _httpClient = httpClientFactory.CreateClient();
    }

    [HttpPost("logs")]
    public async Task<IActionResult> GetLogs([FromBody] string id)
    {
        var token = await ObtainToken();

        var request = new HttpRequestMessage
        {
            Method = HttpMethod.Get,
            RequestUri = new Uri("https://api.unifenas.br/v1/moodle/logs-usuario"),
            Content = new StringContent(JsonConvert.SerializeObject(new { user_id = id }), Encoding.UTF8, "application/json")
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _httpClient.SendAsync(request);

        if (!response.IsSuccessStatusCode)
            return StatusCode((int)response.StatusCode, "Erro ao obter logs");

        var content = await response.Content.ReadAsStringAsync();
        var logs = JsonConvert.DeserializeObject<List<LogResponse>>(content);
        return Ok(logs);
    }

    private async Task<string> ObtainToken()
    {
        var credentials = new
        {
            email = "hackathon@unifenas.br",
            password = "hackathon#2025"
        };

        var content = new StringContent(JsonConvert.SerializeObject(credentials), Encoding.UTF8, "application/json");
        var response = await _httpClient.PostAsync("https://api.unifenas.br/v1/get-token", content);

        var token = JsonConvert.DeserializeObject<TokenResponse>(await response.Content.ReadAsStringAsync());
        return token.access_token;
    }
}

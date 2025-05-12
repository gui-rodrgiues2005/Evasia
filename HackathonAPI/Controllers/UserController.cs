using Microsoft.AspNetCore.Mvc;
using HackathonAPI.Models;
using Newtonsoft.Json;
using System.Net.Http.Headers;
using System.Text;

namespace HackathonAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly HttpClient _httpClient;

        public UserController(IHttpClientFactory httpClientFactory)
        {
            _httpClient = httpClientFactory.CreateClient();
        }

        [HttpGet]
        public async Task<IActionResult> GetUser()
        {
            var token = await ObtainToken();

            _httpClient.DefaultRequestHeaders.Authorization = new
                AuthenticationHeaderValue("Bearer", token);

            var response = await _httpClient.GetAsync("https://api.unifenas.br/v1/moodle/usuarios");

            if (!response.IsSuccessStatusCode)
            {
                return StatusCode((int)response.StatusCode, "Erro ao listar usuários do moodle");
            }

            var json = await response.Content.ReadAsStringAsync();
            var user = JsonConvert.DeserializeObject<List<MoodleUser>>(json);

            return Ok(user);
        }

        private async Task<string> ObtainToken()
        {
            var credentials = new
            {
                email = "hackathon@unifenas.br",
                password = "hackathon#2025"
            };
            
            var content = new StringContent(JsonConvert.SerializeObject(credentials), 
                Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync("https://api.unifenas.br/v1/get-token", content);

            var token = JsonConvert.DeserializeObject<TokenResponse>(await response.Content.ReadAsStringAsync());
            return token.access_token;
        }
        
    }
}

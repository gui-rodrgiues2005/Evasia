using HackathonAPI.Models;
using Newtonsoft.Json;
using System.Net.Http.Headers;
using System.Text;

namespace HackathonAPI.Services
{
    public class UnifenasApiService : IUnifenasApiService
    {
        private readonly HttpClient _httpClient;

        public UnifenasApiService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        private async Task<string?> ObtainToken()
        {
            var credentials = new
            {
                email = "hackathon@unifenas.br",
                password = "hackathon#2025"
            };

            var content = new StringContent(JsonConvert.SerializeObject(credentials), Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync("https://api.unifenas.br/v1/get-token", content);

            if (!response.IsSuccessStatusCode) return null;

            var tokenResponse = JsonConvert.DeserializeObject<TokenResponse>(await response.Content.ReadAsStringAsync());
            return tokenResponse?.access_token;
        }

        public async Task<List<LogResponse>?> GetLogsByUserId(string userId)
        {
            var token = await ObtainToken();
            if (string.IsNullOrEmpty(token)) return null;

            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var body = new StringContent(JsonConvert.SerializeObject(new { user_id = userId }), Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync("https://api.unifenas.br/v1/moodle/logs-usuario", body);

            if (!response.IsSuccessStatusCode) return null;

            var json = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<List<LogResponse>>(json);
        }

        public async Task<List<MoodleUser>?> GetUsuarios()
        {
            var token = await ObtainToken();
            if (string.IsNullOrEmpty(token)) return null;

            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await _httpClient.GetAsync("https://api.unifenas.br/v1/moodle/usuarios");

            if (!response.IsSuccessStatusCode) return null;

            var json = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<List<MoodleUser>>(json);
        }
    }
}

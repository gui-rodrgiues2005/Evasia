namespace HackathonAPI.Models
{
    public class LogResponse
    {
        public string user_id { get; set; }
        public string name { get; set; }
        public string date { get; set; }
        public string action { get; set; }
        public string target { get; set; }
        public string component { get; set; }
        public string course_fullname { get; set; }
        public string user_lastaccess { get; set; }
    }
}

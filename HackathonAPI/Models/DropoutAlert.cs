namespace HackathonAPI.Models
{
    public class DropoutAlert
    {
        public string user_id { get; set; } // Ajuste para user_id minúsculo se a IA retornar assim
        public string Student_name { get; set; }
        public string Course_info { get; set; }
        
    }

    public class StudentInfo
    {
        public string user_id { get; set; }
        public string name { get; set; }
        public string course { get; set; }
    }

    public class RiskInfo
    {
        public string Level { get; set; }
        public int Score { get; set; }
        public int Confidence { get; set; }
        public int Days_Without_Access { get; set; }
    }
}

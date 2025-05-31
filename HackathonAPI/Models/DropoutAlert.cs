namespace HackathonAPI.Models
{
    public class DropoutAlert
    {
        public string Alert_Type { get; set; }
        public StudentInfo Student { get; set; }
        public RiskInfo RiskData { get; set; }
        public List<string> Recommendations { get; set; }
        public string Priority { get; set; }
        public string Analyzed_At { get; set; }
        public string Data_Source { get; set; }
    }

    public class StudentInfo
    {
        public string User_Id { get; set; }
        public string Name { get; set; }
        public string Course { get; set; }
    }

    public class RiskInfo
    {
        public string Level { get; set; }
        public int Score { get; set; }
        public int Confidence { get; set; }
        public int Days_Without_Access { get; set; }
    }
}

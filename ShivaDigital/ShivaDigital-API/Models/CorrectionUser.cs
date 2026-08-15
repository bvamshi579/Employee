using System.Text.Json.Serialization;

namespace ShivaDigital_API.Models;

public class CorrectionUser
{
    [JsonPropertyName("CorrectionUserID")]
    public int? CorrectionUserID { get; set; }

    [JsonPropertyName("Name")]
    public string? Name { get; set; }
}

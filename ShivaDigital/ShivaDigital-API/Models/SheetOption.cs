using System.Text.Json.Serialization;

namespace ShivaDigital_API.Models;

public class SheetOption
{
    [JsonPropertyName("SheetTypeID")]
    public int? SheetTypeID { get; set; }

    [JsonPropertyName("Name")]
    public string? Name { get; set; }

    [JsonPropertyName("Amount")]
    public double? Amount { get; set; }

    [JsonPropertyName("SheetType")]
    public string? SheetType { get; set; }

    [JsonPropertyName("SignatureTitle")]
    public string? SignatureTitle { get; set; }
}

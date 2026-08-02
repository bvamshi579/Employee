using System.Text.Json.Serialization;

namespace ShivaDigital_API.Models;

public class Customer
{
    [JsonPropertyName("CustomerID")]
    public int? CustomerID { get; set; }

    [JsonPropertyName("CustomerName")]
    public string? CustomerName { get; set; }

    [JsonPropertyName("MobileNumber")]
    public string? MobileNumber { get; set; }

    [JsonPropertyName("Address")]
    public string? Address { get; set; }

    [JsonPropertyName("PanNumber")]
    public string? PanNumber { get; set; }

    [JsonPropertyName("AadharNumber")]
    public string? AadharNumber { get; set; }
}

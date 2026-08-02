using System.Text.Json.Serialization;

namespace ShivaDigital_API.Models;

public class BillLine
{
    [JsonPropertyName("SheetTypeID")]
    public int? SheetTypeID { get; set; }

    [JsonPropertyName("SheetName")]
    public string? SheetName { get; set; }

    [JsonPropertyName("Quantity")]
    public int? Quantity { get; set; }

    [JsonPropertyName("Price")]
    public double? Price { get; set; }

    [JsonPropertyName("Amount")]
    public double? Amount { get; set; }
}

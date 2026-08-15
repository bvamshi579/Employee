using System.Text.Json.Serialization;

namespace ShivaDigital_API.Models;

public class SheetInventory
{
    [JsonPropertyName("SheetTypeID")]
    public int? SheetTypeID { get; set; }

    [JsonPropertyName("Name")]
    public string? Name { get; set; }

    [JsonPropertyName("Quantity")]
    public int? Quantity { get; set; }
}

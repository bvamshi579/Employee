using System.Text.Json.Serialization;

namespace ShivaDigital_API.Models;

public class SheetInventoryTx
{
    [JsonPropertyName("TxID")]
    public int? TxID { get; set; }

    [JsonPropertyName("SheetTypeID")]
    public int? SheetTypeID { get; set; }

    [JsonPropertyName("TxDate")]
    public DateTime? TxDate { get; set; }

    [JsonPropertyName("TxType")]
    public string? TxType { get; set; }

    [JsonPropertyName("Quantity")]
    public int? Quantity { get; set; }

    [JsonPropertyName("SourceType")]
    public string? SourceType { get; set; }

    [JsonPropertyName("SourceRef")]
    public string? SourceRef { get; set; }

    [JsonPropertyName("PerformedBy")]
    public string? PerformedBy { get; set; }

    [JsonPropertyName("Comment")]
    public string? Comment { get; set; }

    [JsonPropertyName("BalanceAfter")]
    public int? BalanceAfter { get; set; }
}

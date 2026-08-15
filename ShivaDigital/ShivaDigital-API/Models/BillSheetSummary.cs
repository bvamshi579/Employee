using System.Text.Json.Serialization;

namespace ShivaDigital_API.Models;

public class BillSheetSummary
{
    [JsonPropertyName("BillID")]
    public int? BillID { get; set; }

    [JsonPropertyName("Lines")]
    public List<BillLine>? Lines { get; set; }
}

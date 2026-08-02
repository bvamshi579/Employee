using System.Text.Json.Serialization;

namespace ShivaDigital_API.Models;

public class FileSizeOption
{
    [JsonPropertyName("ID")]
    public int? ID { get; set; }

    [JsonPropertyName("FileSize")]
    public string? FileSize { get; set; }
}

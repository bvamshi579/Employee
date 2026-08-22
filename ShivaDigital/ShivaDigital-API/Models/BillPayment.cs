using System.Text.Json.Serialization;

namespace ShivaDigital_API.Models;

public class BillPayment
{
    [JsonPropertyName("BillPaymentID")]
    public int? BillPaymentID { get; set; }

    [JsonPropertyName("BillID")]
    public int? BillID { get; set; }

    [JsonPropertyName("PaymentDate")]
    public DateTime? PaymentDate { get; set; }

    [JsonPropertyName("AmountPaid")]
    public int? AmountPaid { get; set; }

    [JsonPropertyName("PaymentMethod")]
    public string? PaymentMethod { get; set; }

    [JsonPropertyName("BillLogID")]
    public int? BillLogID { get; set; }
}

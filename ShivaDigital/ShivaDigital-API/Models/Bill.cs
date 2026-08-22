using System.Text.Json.Serialization;

namespace ShivaDigital_API.Models;

public class Bill
{
    [JsonPropertyName("BillID")]
    public int? BillID { get; set; }

    [JsonPropertyName("CustomerID")]
    public int? CustomerID { get; set; }

    [JsonPropertyName("CustomerName")]
    public string? CustomerName { get; set; }

    [JsonPropertyName("MobileNumber")]
    public string? MobileNumber { get; set; }

    [JsonPropertyName("BillDate")]
    public DateTime? BillDate { get; set; }

    [JsonPropertyName("PaymentDate")]
    public DateTime? PaymentDate { get; set; }

    [JsonPropertyName("PaymentAmount")]
    public int? PaymentAmount { get; set; }

    [JsonPropertyName("PaymentMethod")]
    public string? PaymentMethod { get; set; }

    [JsonPropertyName("Files")]
    public string? Files { get; set; }

    [JsonPropertyName("FileSize")]
    public int? FileSize { get; set; }

    [JsonPropertyName("BookingTime")]
    public DateTime? BookingTime { get; set; }

    [JsonPropertyName("DeliveryTime")]
    public DateTime? DeliveryTime { get; set; }

    [JsonPropertyName("Total")]
    public double? Total { get; set; }

    [JsonPropertyName("Advance")]
    public double? Advance { get; set; }

    [JsonPropertyName("BalancePaid")]
    public int? BalancePaid { get; set; }

    [JsonPropertyName("Discount")]
    public int? Discount { get; set; }

    [JsonPropertyName("BillType")]
    public string? BillType { get; set; }

    [JsonPropertyName("Lines")]
    public List<BillLine>? Lines { get; set; }

    [JsonPropertyName("AdvancePayments")]
    public List<BillPayment>? AdvancePayments { get; set; }

    [JsonPropertyName("CorrectionUserID")]
    public int? CorrectionUserID { get; set; }

    [JsonPropertyName("CorrectionUserName")]
    public string? CorrectionUserName { get; set; }
}

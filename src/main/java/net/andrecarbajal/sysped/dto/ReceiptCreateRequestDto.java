package net.andrecarbajal.sysped.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReceiptCreateRequestDto {

    @NotBlank(message = "El tipo de comprobante es obligatorio")
    @Pattern(regexp = "^(BOLETA|FACTURA)$", message = "El tipo de comprobante debe ser BOLETA o FACTURA")
    private String receiptType;

    @Pattern(regexp = "^\\d{8}$", message = "El DNI debe tener 8 dígitos numéricos")
    private String dni;

    @Size(max = 120, message = "El nombre del cliente no debe exceder 120 caracteres")
    private String customerName;

    @Pattern(regexp = "^\\d{11}$", message = "El RUC debe tener 11 dígitos numéricos")
    private String ruc;

    @DecimalMin(value = "0.0", message = "El descuento no puede ser negativo")
    @Digits(integer = 11, fraction = 2, message = "El descuento debe tener máximo 11 enteros y 2 decimales")
    private BigDecimal discount;
}
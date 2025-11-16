package net.andrecarbajal.sysped.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemDto {
    @NotNull
    private Long plateId;

    private PlateDto plate;

    @Min(1)
    private int quantity;

    private BigDecimal priceUnit;
    private BigDecimal totalPrice;

    private String notes;
}
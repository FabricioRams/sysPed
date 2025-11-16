package net.andrecarbajal.sysped.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderCreateRequestDto {
    @NotNull
    private Integer tableNumber;

    @NotEmpty
    @Valid
    private List<OrderItemDto> items;
}
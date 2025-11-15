package net.andrecarbajal.sysped.dto;

import net.andrecarbajal.sysped.model.OrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrderDto(
        Long id,
        Integer tableNumber,
        LocalDateTime dateAndTimeOrder,
        OrderStatus status,
        BigDecimal totalPrice,
        List<OrderItemResponseDto> details
) {
}
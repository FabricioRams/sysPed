package net.andrecarbajal.sysped.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import net.andrecarbajal.sysped.model.OrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderDto {
    private Long id;
    private Integer tableNumber;
    private LocalDateTime dateAndTimeOrder;
    private OrderStatus status;
    private BigDecimal totalPrice;
    private List<OrderItemDto> items;
}
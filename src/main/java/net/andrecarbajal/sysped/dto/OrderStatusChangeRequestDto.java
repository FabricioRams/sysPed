package net.andrecarbajal.sysped.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderStatusChangeRequestDto {
    private Long orderId;
    private String status;
}

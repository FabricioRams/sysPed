package net.andrecarbajal.sysped.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlateDto {
    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private String imageBase64;
    private Boolean active;
}
package net.andrecarbajal.sysped.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import net.andrecarbajal.sysped.model.TableStatus;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TableDto {
    private Integer number;
    private TableStatus status;
}

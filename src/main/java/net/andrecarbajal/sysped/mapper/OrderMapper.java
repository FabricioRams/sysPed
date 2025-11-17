package net.andrecarbajal.sysped.mapper;

import net.andrecarbajal.sysped.dto.OrderDto;
import net.andrecarbajal.sysped.dto.OrderItemDto;
import net.andrecarbajal.sysped.dto.PlateDto;
import net.andrecarbajal.sysped.model.Order;
import net.andrecarbajal.sysped.model.OrderDetails;
import net.andrecarbajal.sysped.model.Plate;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

public class OrderMapper {
    public static OrderDto toDto(Order order) {
        if (order == null) {
            return null;
        }

        return OrderDto.builder()
                .id(order.getId())
                .tableNumber(order.getRestaurantTable().getNumber())
                .dateAndTimeOrder(order.getDateandtimeOrder())
                .status(order.getStatus())
                .totalPrice(order.getPriceTotal())
                .items(toOrderItemDtoList(order.getDetails()))
                .build();
    }

    public static List<OrderItemDto> toOrderItemDtoList(List<OrderDetails> details) {
        if (details == null) {
            return List.of();
        }

        return details.stream()
                .map(OrderMapper::toOrderItemDto)
                .collect(Collectors.toList());
    }

    public static OrderItemDto toOrderItemDto(OrderDetails detail) {
        if (detail == null) {
            return null;
        }

        return OrderItemDto.builder()
                .plateId(detail.getPlate().getId())
                .plate(toPlateDto(detail.getPlate()))
                .quantity(detail.getQuantity())
                .priceUnit(detail.getPriceUnit())
                .totalPrice(detail.getPriceUnit().multiply(BigDecimal.valueOf(detail.getQuantity())))
                .notes(detail.getNotes())
                .build();
    }

    public static PlateDto toPlateDto(Plate plate) {
        if (plate == null) {
            return null;
        }

        return PlateDto.builder()
                .id(plate.getId())
                .name(plate.getName())
                .description(plate.getDescription())
                .price(plate.getPrice())
                .imageBase64(plate.getImageBase64())
                .active(plate.isActive())
                .build();
    }
}
package net.andrecarbajal.sysped.service;

import lombok.RequiredArgsConstructor;
import net.andrecarbajal.sysped.controller.OrderWebSocketController;
import net.andrecarbajal.sysped.dto.OrderCreateRequestDto;
import net.andrecarbajal.sysped.dto.OrderDto;
import net.andrecarbajal.sysped.mapper.OrderMapper;
import net.andrecarbajal.sysped.model.Order;
import net.andrecarbajal.sysped.model.OrderDetails;
import net.andrecarbajal.sysped.model.OrderStatus;
import net.andrecarbajal.sysped.model.Plate;
import net.andrecarbajal.sysped.model.RestaurantTable;
import net.andrecarbajal.sysped.model.Staff;
import net.andrecarbajal.sysped.model.TableStatus;
import net.andrecarbajal.sysped.repository.OrderRepository;
import net.andrecarbajal.sysped.repository.PlateRepository;
import net.andrecarbajal.sysped.repository.StaffRepository;
import net.andrecarbajal.sysped.repository.TableRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final TableRepository tableRepository;
    private final PlateRepository plateRepository;
    private final StaffRepository staffRepository;
    private final TableService tableService;
    private final OrderWebSocketController orderWebSocketController;

    @Transactional
    public OrderDto createOrder(OrderCreateRequestDto request) {
        RestaurantTable restaurantTable = tableRepository.findByNumber(request.getTableNumber())
                .orElseThrow(() -> new IllegalArgumentException("Mesa no encontrada: " + request.getTableNumber()));

        if (restaurantTable.getStatus() != TableStatus.DISPONIBLE) {
            throw new IllegalStateException("La mesa " + request.getTableNumber() + " no está disponible para pedidos");
        }

        Staff currentStaff = getCurrentStaff();

        Order order = new Order();
        order.setRestaurantTable(restaurantTable);
        order.setStaff(currentStaff);
        order.setStatus(OrderStatus.PENDIENTE);

        BigDecimal totalPrice = BigDecimal.ZERO;

        for (var item : request.getItems()) {
            Plate plate = plateRepository.findById(item.getPlateId())
                    .orElseThrow(() -> new IllegalArgumentException("Plato no encontrado: " + item.getPlateId()));

            if (!Boolean.TRUE.equals(plate.isActive())) {
                throw new IllegalStateException("El plato " + plate.getName() + " no está disponible");
            }

            OrderDetails detail = new OrderDetails();
            detail.setOrder(order);
            detail.setPlate(plate);
            detail.setQuantity(item.getQuantity());
            detail.setPriceUnit(plate.getPrice());
            detail.setNotes(item.getNotes());

            order.addOrderDetail(detail);

            BigDecimal itemTotal = plate.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            totalPrice = totalPrice.add(itemTotal);
        }

        order.setPriceTotal(totalPrice);

        Order savedOrder = orderRepository.save(order);

        tableService.updateTableStatus(request.getTableNumber(), TableStatus.ESPERANDO_PEDIDO);

        try {
            orderWebSocketController.sendOrderUpdate(OrderMapper.toDto(savedOrder));
        } catch (Exception ignored) {
        }

        return OrderMapper.toDto(savedOrder);
    }

    public List<OrderDto> listOrders(String statusFilter) {
        List<Order> orders = orderRepository.findAll();
        Stream<Order> stream = orders.stream();
        if (statusFilter != null && !"ALL".equalsIgnoreCase(statusFilter)) {
            String[] parts = statusFilter.split(",");
            Set<OrderStatus> allowed = new HashSet<>();
            for (String p : parts) {
                String trimmed = p.trim();
                if (trimmed.isEmpty()) continue;
                allowed.add(OrderStatus.valueOf(trimmed));
            }
            if (!allowed.isEmpty()) {
                stream = stream.filter(o -> allowed.contains(o.getStatus()));
            } else {
                return Collections.emptyList();
            }
        }
        return stream.map(OrderMapper::toDto).toList();
    }

    @Transactional
    public OrderDto updateOrderStatus(Long orderId, OrderStatus newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Pedido no encontrado: " + orderId));
        OrderStatus current = order.getStatus();
        Set<OrderStatus> allowed = switch (current) {
            case PENDIENTE -> Set.of(OrderStatus.EN_PREPARACION, OrderStatus.CANCELADO);
            case EN_PREPARACION -> Set.of(OrderStatus.LISTO, OrderStatus.CANCELADO);
            case LISTO -> Set.of(OrderStatus.PAGADO);
            default -> Set.of();
        };
        if (!allowed.contains(newStatus)) {
            throw new IllegalStateException("Operación no permitida: " + current + " -> " + newStatus);
        }
        order.setStatus(newStatus);
        Order saved = orderRepository.save(order);
        if (newStatus == OrderStatus.LISTO) {
            try {
                tableService.updateTableStatus(saved.getRestaurantTable().getNumber(), TableStatus.PEDIDO_ENTREGADO);
            } catch (IllegalStateException e) {
                System.err.println("No se pudo actualizar estado de mesa al marcar pedido LISTO: " + e.getMessage());
            }
        }
        try {
            orderWebSocketController.sendOrderUpdate(OrderMapper.toDto(saved));
        } catch (Exception ignored) {
        }
        return OrderMapper.toDto(saved);
    }

    @Transactional(readOnly = true)
    public Optional<OrderDto> getOrderById(Long orderId) {
        return orderRepository.findById(orderId).map(OrderMapper::toDto);
    }

    @Transactional
    public OrderDto updateOrder(Long orderId, OrderCreateRequestDto request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Pedido no encontrado: " + orderId));

        if (order.getStatus() != OrderStatus.PENDIENTE) {
            throw new IllegalStateException("Solo se pueden editar pedidos pendientes");
        }

        order.getDetails().clear();

        BigDecimal totalPrice = BigDecimal.ZERO;

        for (var item : request.getItems()) {
            Plate plate = plateRepository.findById(item.getPlateId())
                    .orElseThrow(() -> new IllegalArgumentException("Plato no encontrado: " + item.getPlateId()));

            if (!Boolean.TRUE.equals(plate.isActive())) {
                throw new IllegalStateException("El plato " + plate.getName() + " no está disponible");
            }

            OrderDetails detail = new OrderDetails();
            detail.setOrder(order);
            detail.setPlate(plate);
            detail.setQuantity(item.getQuantity());
            detail.setPriceUnit(plate.getPrice());
            detail.setNotes(item.getNotes());

            order.addOrderDetail(detail);

            BigDecimal itemTotal = plate.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            totalPrice = totalPrice.add(itemTotal);
        }

        order.setPriceTotal(totalPrice);

        Order savedOrder = orderRepository.save(order);

        try {
            orderWebSocketController.sendOrderUpdate(OrderMapper.toDto(savedOrder));
        } catch (Exception ignored) {
        }

        return OrderMapper.toDto(savedOrder);
    }

    public Optional<OrderDto> getPendingOrderByTableNumber(Integer tableNumber) {
        return orderRepository.findByRestaurantTable_NumberAndStatus(tableNumber, OrderStatus.PENDIENTE)
                .map(OrderMapper::toDto);
    }

    private Staff getCurrentStaff() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new IllegalStateException("Usuario no autenticado");
        }
        String dni = auth.getName();
        return staffRepository.findByDni(dni)
                .orElseThrow(() -> new IllegalStateException("Staff no encontrado: " + dni));
    }
}
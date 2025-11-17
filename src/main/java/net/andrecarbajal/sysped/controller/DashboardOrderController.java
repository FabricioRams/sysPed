package net.andrecarbajal.sysped.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import net.andrecarbajal.sysped.dto.OrderCreateRequestDto;
import net.andrecarbajal.sysped.dto.OrderDto;
import net.andrecarbajal.sysped.dto.OrderStatusChangeRequestDto;
import net.andrecarbajal.sysped.dto.PlateDto;
import net.andrecarbajal.sysped.model.OrderStatus;
import net.andrecarbajal.sysped.service.OrderService;
import net.andrecarbajal.sysped.service.PlateService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/dashboard/orders")
@RequiredArgsConstructor
public class DashboardOrderController {
    private final OrderService orderService;
    private final PlateService plateService;

    @PostMapping
    public ResponseEntity<OrderDto> createOrder(@Valid @RequestBody OrderCreateRequestDto request) {
        try {
            OrderDto response = orderService.createOrder(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping
    public ResponseEntity<List<OrderDto>> listOrders(@RequestParam(required = false) String status) {
        try {
            String filter = status;
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            boolean isCocinero = false;
            if (auth != null && auth.getAuthorities() != null) {
                isCocinero = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().toUpperCase().contains("COCINERO"));
            }
            if ((filter == null || filter.isBlank()) && isCocinero) {
                filter = "PENDIENTE,EN_PREPARACION";
            }
            List<OrderDto> list = orderService.listOrders(filter == null ? "ALL" : filter);
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/{orderId}/status")
    public ResponseEntity<Object> changeOrderStatus(@PathVariable Long orderId, @RequestBody OrderStatusChangeRequestDto body) {
        try {
            OrderStatus st = OrderStatus.valueOf(body.getStatus());
            OrderDto updated = orderService.updateOrderStatus(orderId, st);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Estado inválido: " + body.getStatus());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(e.getMessage());
        } catch (Exception e) {
            String msg = e.getMessage() != null ? e.getMessage() : "Error interno al actualizar pedido";
            return ResponseEntity.status(500).body(msg);
        }
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<OrderDto> getOrder(@PathVariable Long orderId) {
        return orderService.getOrderById(orderId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/table/{tableNumber}")
    public ResponseEntity<OrderDto> getPendingOrderByTable(@PathVariable Integer tableNumber) {
        try {
            return orderService.getPendingOrderByTableNumber(tableNumber)
                    .map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/{orderId}")
    public ResponseEntity<OrderDto> updateOrder(@PathVariable Long orderId, @Valid @RequestBody OrderCreateRequestDto request) {
        try {
            OrderDto response = orderService.updateOrder(orderId, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/plates")
    public ResponseEntity<List<PlateDto>> getAvailablePlates() {
        try {
            List<PlateDto> plates = plateService.findAllActivePlates();
            return ResponseEntity.ok(plates);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
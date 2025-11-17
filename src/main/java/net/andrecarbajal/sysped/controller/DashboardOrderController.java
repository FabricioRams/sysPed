package net.andrecarbajal.sysped.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import net.andrecarbajal.sysped.dto.OrderCreateRequestDto;
import net.andrecarbajal.sysped.dto.OrderDto;
import net.andrecarbajal.sysped.dto.OrderStatusChangeRequestDto;
import net.andrecarbajal.sysped.dto.PlateDto;
import net.andrecarbajal.sysped.dto.ReceiptCreateRequestDto;
import net.andrecarbajal.sysped.dto.ReceiptResponseDto;
import net.andrecarbajal.sysped.model.OrderStatus;
import net.andrecarbajal.sysped.service.OrderService;
import net.andrecarbajal.sysped.service.PlateService;
import net.andrecarbajal.sysped.service.ReceiptService;
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
    private final ReceiptService receiptService;

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

    @PostMapping("/caja/change-status")
    public ResponseEntity<Object> changeCajaOrderStatus(@RequestBody OrderStatusChangeRequestDto body) {
        try {
            OrderStatus newStatus = OrderStatus.valueOf(body.getStatus());
            if (newStatus != OrderStatus.CANCELADO && newStatus != OrderStatus.PAGADO) {
                return ResponseEntity.badRequest().body("Estado inválido para caja. Solo se permite CANCELADO o PAGADO");
            }

            Long orderId = body.getOrderId();
            if (orderId == null) {
                return ResponseEntity.badRequest().body("ID de pedido requerido");
            }

            OrderDto currentOrder = orderService.getOrderById(orderId)
                    .orElseThrow(() -> new IllegalArgumentException("Pedido no encontrado: " + orderId));

            OrderStatus currentStatus = currentOrder.getStatus();

            if (newStatus == OrderStatus.PAGADO && currentStatus != OrderStatus.LISTO) {
                return ResponseEntity.status(409).body("Solo se pueden marcar como PAGADO los pedidos en estado LISTO");
            }

            if (newStatus == OrderStatus.CANCELADO &&
                    currentStatus != OrderStatus.PENDIENTE &&
                    currentStatus != OrderStatus.EN_PREPARACION &&
                    currentStatus != OrderStatus.LISTO) {
                return ResponseEntity.status(409).body("No se puede cancelar un pedido en estado " + currentStatus);
            }

            OrderDto updated = orderService.updateOrderStatus(orderId, newStatus);
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

    @PostMapping("/{orderId}/receipt")
    public ResponseEntity<Object> createReceipt(@PathVariable Long orderId, @Valid @RequestBody ReceiptCreateRequestDto request) {
        try {
            ReceiptResponseDto response = receiptService.createReceipt(orderId, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(e.getMessage());
        } catch (Exception e) {
            String msg = e.getMessage() != null ? e.getMessage() : "Error interno al crear el recibo";
            return ResponseEntity.status(500).body(msg);
        }
    }

    @GetMapping("/{orderId}/receipt")
    public ResponseEntity<ReceiptResponseDto> getReceipt(@PathVariable Long orderId) {
        return receiptService.getReceiptByOrderId(orderId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
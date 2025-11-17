package net.andrecarbajal.sysped.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import net.andrecarbajal.sysped.dto.OrderDto;
import net.andrecarbajal.sysped.dto.OrderStatusChangeRequestDto;
import net.andrecarbajal.sysped.dto.ReceiptCreateRequestDto;
import net.andrecarbajal.sysped.dto.ReceiptResponseDto;
import net.andrecarbajal.sysped.model.OrderStatus;
import net.andrecarbajal.sysped.service.OrderService;
import net.andrecarbajal.sysped.service.ReceiptService;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/dashboard/receipt")
@RequiredArgsConstructor
public class DashboardReceiptController {
    private final OrderService orderService;
    private final ReceiptService receiptService;

    @PostMapping("/change-status")
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

    @PostMapping("/{orderId}")
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

    @GetMapping("/{orderId}")
    public ResponseEntity<ReceiptResponseDto> getReceipt(@PathVariable Long orderId) {
        return receiptService.getReceiptByOrderId(orderId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}

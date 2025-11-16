package net.andrecarbajal.sysped.controller;

import lombok.RequiredArgsConstructor;
import net.andrecarbajal.sysped.dto.TableDto;
import net.andrecarbajal.sysped.model.TableStatus;
import net.andrecarbajal.sysped.service.TableService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class TableStatusWebSocketController {
    private final TableService tableService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/mesas/update-status")
    public void updateTableStatusWS(TableDto dto) {
        try {
            TableStatus newStatus;
            if (dto.getStatus() != null) {
                newStatus = dto.getStatus();
            } else {
                throw new IllegalArgumentException("Status cannot be null");
            }

            TableDto updatedDto = tableService.updateTableStatus(dto.getNumber(), newStatus);
            messagingTemplate.convertAndSend("/topic/table-status", updatedDto);
        } catch (IllegalArgumentException e) {
            messagingTemplate.convertAndSend("/topic/table-errors", "Estado no válido: " + e.getMessage());
        } catch (Exception e) {
            messagingTemplate.convertAndSend("/topic/table-errors", "ERROR: " + e.getMessage());
        }
    }
}
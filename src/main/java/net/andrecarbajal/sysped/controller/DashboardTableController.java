package net.andrecarbajal.sysped.controller;

import lombok.RequiredArgsConstructor;
import net.andrecarbajal.sysped.dto.TableDto;
import net.andrecarbajal.sysped.model.TableStatus;
import net.andrecarbajal.sysped.service.TableService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/dashboard/tables")
@RequiredArgsConstructor
public class DashboardTableController {
    private final TableService tableService;

    @GetMapping("/{tableNumber}/allowed-statuses")
    public ResponseEntity<List<String>> getAllowedStatuses(@PathVariable Integer tableNumber) {
        try {
            Set<TableStatus> allowed = tableService.getAllowedStatuses(tableNumber);
            List<String> allowedNames = allowed.stream().map(Enum::name).collect(Collectors.toList());
            return ResponseEntity.ok(allowedNames);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/{tableId}/status")
    public ResponseEntity<Void> changeStatus(@PathVariable Long tableId, @RequestBody TableDto statusUpdate) {
        try {
            // TableDto now uses TableStatus enum directly
            if (statusUpdate.getStatus() == null) {
                return ResponseEntity.badRequest().build();
            }
            tableService.changeStatus(tableId, statusUpdate.getStatus());
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
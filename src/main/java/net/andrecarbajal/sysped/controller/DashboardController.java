package net.andrecarbajal.sysped.controller;

import lombok.RequiredArgsConstructor;
import net.andrecarbajal.sysped.model.Category;
import net.andrecarbajal.sysped.model.Rol;
import net.andrecarbajal.sysped.model.Staff;
import net.andrecarbajal.sysped.service.CategoryService;
import net.andrecarbajal.sysped.service.OrderService;
import net.andrecarbajal.sysped.service.RolService;
import net.andrecarbajal.sysped.service.StaffService;
import net.andrecarbajal.sysped.service.TableService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;
import java.util.stream.Collectors;

@Controller
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {
    private final StaffService staffService;
    private final RolService rolService;
    private final CategoryService categoryService;
    private final TableService tableService;
    private final OrderService orderService;

    @GetMapping
    public String dashboard(Model model) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        String staff_name = this.staffService.findStaffByDni(auth.getName())
                .map(Staff::getName)
                .orElse("Unknown User");
        model.addAttribute("staff_name", staff_name);
        return "dashboard";
    }

    @GetMapping("/personal_fragment")
    public String personalFragment(Model model) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String dni = auth.getName();
        String currentRol = this.staffService.findStaffByDni(dni)
                .map(staff -> staff.getRol().getName().toUpperCase())
                .orElse("");
        List<Rol> allRoles = this.rolService.findAllRol();
        List<Rol> filteredRoles = switch (currentRol) {
            case "JEFE" -> allRoles.stream()
                    .filter(rol -> !"JEFE".equalsIgnoreCase(rol.getName()))
                    .collect(Collectors.toList());
            case "ADMINISTRADOR" -> allRoles.stream()
                    .filter(rol -> "MOZO".equalsIgnoreCase(rol.getName()) || "COCINERO".equalsIgnoreCase(rol.getName()))
                    .collect(Collectors.toList());
            default -> List.of();
        };
        model.addAttribute("users", this.staffService.findAllStaff());
        model.addAttribute("roles", filteredRoles);
        model.addAttribute("currentRol", currentRol);
        return "fragments/personal";
    }

    @GetMapping("/platos_fragment")
    public String platosFragment(Model model) {
        List<Category> categories = categoryService.findAllCategories();
        model.addAttribute("categories", categories);
        return "fragments/platos";
    }

    @GetMapping("/mesas_fragment")
    public String mesasFragment(Model model) {
        model.addAttribute("listaDeMesas", tableService.getOperativeTables());
        model.addAttribute("resumenMesas", tableService.getTableSummary());
        return "fragments/mesas";
    }

    @GetMapping("/cocinero_fragment")
    public String cocineroFragment() {
        return "fragments/cocinero";
    }

    @GetMapping("/caja_fragment")
    public String cajaFragment(Model model) {
        String statusFilter = "PENDIENTE,EN_PREPARACION,LISTO";
        model.addAttribute("pedidos", orderService.listOrders(statusFilter));
        return "fragments/caja";
    }
}

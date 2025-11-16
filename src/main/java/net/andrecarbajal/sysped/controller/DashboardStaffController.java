package net.andrecarbajal.sysped.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import net.andrecarbajal.sysped.dto.StaffRequestDto;
import net.andrecarbajal.sysped.model.Rol;
import net.andrecarbajal.sysped.service.RolService;
import net.andrecarbajal.sysped.service.StaffService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/dashboard/staff")
@RequiredArgsConstructor
public class DashboardStaffController {
    private final StaffService staffService;
    private final RolService rolService;

    @PostMapping("/delete")
    public String deleteStaff(@RequestParam String dni, RedirectAttributes redirectAttributes) {
        try {
            if (!this.staffService.existStaffByDni(dni)) {
                redirectAttributes.addFlashAttribute("error", "El usuario con DNI " + dni + " no existe.");
                return "redirect:/dashboard";
            }

            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (dni.equals(auth.getName())) {
                redirectAttributes.addFlashAttribute("error", "No puedes eliminarte a ti mismo.");
                return "redirect:/dashboard";
            }

            this.staffService.deleteStaffByDni(dni);
            redirectAttributes.addFlashAttribute("success", "Usuario eliminado correctamente.");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "Error al eliminar el usuario: " + e.getMessage());
        }

        return "redirect:/dashboard";
    }

    @PostMapping("/edit")
    public String editStaff(@Valid @ModelAttribute StaffRequestDto staffEditRequestDto, BindingResult result, RedirectAttributes redirectAttributes) {
        if (result.hasErrors()) {
            redirectAttributes.addFlashAttribute("error", "Datos inválidos para editar personal.");
            return "redirect:/dashboard";
        }
        try {
            Rol rol = this.rolService.findRolByName(staffEditRequestDto.getRolName())
                    .orElseThrow(() -> new IllegalArgumentException("El rol no existe."));
            this.staffService.updateStaff(staffEditRequestDto, rol);
            redirectAttributes.addFlashAttribute("success", "Datos del personal actualizados correctamente.");
        } catch (IllegalArgumentException e) {
            redirectAttributes.addFlashAttribute("error", e.getMessage());
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "Error al actualizar: " + e.getMessage());
        }
        return "redirect:/dashboard";
    }

    @PostMapping("/create")
    public String createStaff(@Valid @ModelAttribute StaffRequestDto staffCreateRequestDto, BindingResult result, RedirectAttributes redirectAttributes) {
        if (result.hasErrors()) {
            redirectAttributes.addFlashAttribute("error", "Datos inválidos para crear personal: " + result.getAllErrors().getFirst().getDefaultMessage());
            return "redirect:/dashboard";
        }
        try {
            Rol rol = this.rolService.findRolByName(staffCreateRequestDto.getRolName())
                    .orElseThrow(() -> new IllegalArgumentException("El rol no existe."));
            this.staffService.createStaff(staffCreateRequestDto, rol);
            redirectAttributes.addFlashAttribute("success", "Personal creado correctamente.");
        } catch (IllegalArgumentException e) {
            redirectAttributes.addFlashAttribute("error", e.getMessage());
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "Error al crear el personal: " + e.getMessage());
        }
        return "redirect:/dashboard";
    }
}

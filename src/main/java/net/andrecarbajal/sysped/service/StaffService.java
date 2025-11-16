package net.andrecarbajal.sysped.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import net.andrecarbajal.sysped.dto.StaffRequestDto;
import net.andrecarbajal.sysped.model.Rol;
import net.andrecarbajal.sysped.model.Staff;
import net.andrecarbajal.sysped.model.StaffAudit;
import net.andrecarbajal.sysped.repository.StaffAuditRepository;
import net.andrecarbajal.sysped.repository.StaffRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class StaffService {
    private final StaffRepository staffRepository;
    private final PasswordEncoder passwordEncoder;
    private final StaffAuditRepository staffAuditRepository;

    private String currentUsername() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                return "SYSTEM";
            }
            return auth.getName();
        } catch (Exception e) {
            return "SYSTEM";
        }
    }

    @Transactional
    public void createStaff(StaffRequestDto dto, Rol rol) {
        if (dto.getPassword() == null || dto.getPassword().isBlank()) {
            throw new IllegalArgumentException("La contraseña es obligatoria para crear un nuevo usuario");
        }

        Optional<Staff> existingStaff = staffRepository.findByDni(dto.getDni());

        Staff staff;
        boolean isNew = false;
        if (existingStaff.isPresent()) {
            staff = existingStaff.get();
            if (staff.getActive()) {
                throw new IllegalArgumentException("Ya existe un usuario activo con el DNI " + dto.getDni());
            }
            staff.setActive(true);
            staff.setName(dto.getName());
            staff.setPassword(passwordEncoder.encode(dto.getPassword()));
            staff.setRol(rol);
        } else {
            staff = new Staff();
            staff.setDni(dto.getDni());
            staff.setName(dto.getName());
            staff.setPassword(passwordEncoder.encode(dto.getPassword()));
            staff.setRol(rol);
            staff.setActive(true);
            isNew = true;
        }
        Staff saved = staffRepository.save(staff);

        // Auditing
        StaffAudit audit = new StaffAudit();
        audit.setDni(saved.getDni());
        audit.setName(saved.getName());
        audit.setRolName(saved.getRol() != null ? saved.getRol().getName() : null);
        audit.setWhenEvent(OffsetDateTime.now());
        audit.setPerformedBy(currentUsername());
        audit.setAction(isNew ? "INSERT" : "REACTIVATE");
        try {
            staffAuditRepository.save(audit);
        } catch (Exception e) {
            System.err.println("Failed to save staff audit: " + e.getMessage());
        }
    }

    @Transactional
    public void deleteStaffByDni(String dni) {
        Staff staff = staffRepository.findByDni(dni)
                .orElseThrow(() -> new IllegalArgumentException("Staff no encontrado"));
        staff.setActive(false);
        Staff saved = staffRepository.save(staff);

        StaffAudit audit = new StaffAudit();
        audit.setDni(saved.getDni());
        audit.setName(saved.getName());
        audit.setRolName(saved.getRol() != null ? saved.getRol().getName() : null);
        audit.setWhenEvent(OffsetDateTime.now());
        audit.setPerformedBy(currentUsername());
        audit.setAction("DELETE");
        try {
            staffAuditRepository.save(audit);
        } catch (Exception e) {
            System.err.println("Failed to save staff audit: " + e.getMessage());
        }
    }

    public boolean existStaffByDni(String dni) {
        return staffRepository.findByDniAndActiveTrue(dni).isPresent();
    }

    @Transactional
    public void updateStaff(StaffRequestDto dto, Rol rol) {
        Staff staff = staffRepository.findByDni(dto.getDni())
                .orElseThrow(() -> new IllegalArgumentException("Staff no encontrado"));
        staff.setName(dto.getName());
        staff.setRol(rol);
        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            staff.setPassword(passwordEncoder.encode(dto.getPassword()));
        }
        Staff saved = staffRepository.save(staff);

        StaffAudit audit = new StaffAudit();
        audit.setDni(saved.getDni());
        audit.setName(saved.getName());
        audit.setRolName(saved.getRol() != null ? saved.getRol().getName() : null);
        audit.setWhenEvent(OffsetDateTime.now());
        audit.setPerformedBy(currentUsername());
        audit.setAction("UPDATE");
        try {
            staffAuditRepository.save(audit);
        } catch (Exception e) {
            System.err.println("Failed to save staff audit: " + e.getMessage());
        }
    }

    public List<Staff> findAllStaff() {
        return staffRepository.findByActiveTrue();
    }

    public Optional<Staff> findStaffByDni(String dni) {
        return staffRepository.findByDni(dni);
    }
}

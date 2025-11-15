package net.andrecarbajal.sysped.repository;

import net.andrecarbajal.sysped.model.Staff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StaffRepository extends JpaRepository<Staff, String> {
    Optional<Staff> findByDni(String dni);

    List<Staff> findByActiveTrue();

    Optional<Staff> findByDniAndActiveTrue(String dni);
}
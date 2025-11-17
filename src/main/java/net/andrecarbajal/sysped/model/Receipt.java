package net.andrecarbajal.sysped.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "receipts")
@Getter
@Setter
public class Receipt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private Order order;

    @Column(length = 11)
    @Pattern(regexp = "^\\d{11}$", message = "El RUC debe tener 11 dígitos numéricos", groups = {})
    private String ruc;

    @Column(length = 8)
    @Pattern(regexp = "^\\d{8}$", message = "El DNI debe tener 8 dígitos numéricos", groups = {})
    private String dni;

    @Column(name = "customer_name", length = 120)
    @Size(max = 120, message = "El nombre del cliente no debe exceder 120 caracteres")
    private String customerName;

    @Column(nullable = false, precision = 13, scale = 2)
    @Digits(integer = 11, fraction = 2)
    private BigDecimal discount = BigDecimal.ZERO;

    @Column(nullable = false, precision = 13, scale = 2)
    @Digits(integer = 11, fraction = 2)
    private BigDecimal subtotal;

    @Column(nullable = false, precision = 13, scale = 2)
    @Digits(integer = 11, fraction = 2)
    private BigDecimal igv;

    @Column(nullable = false, precision = 13, scale = 2)
    @Digits(integer = 11, fraction = 2)
    private BigDecimal total;
}

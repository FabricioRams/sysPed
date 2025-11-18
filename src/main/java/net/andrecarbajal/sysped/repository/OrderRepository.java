package net.andrecarbajal.sysped.repository;

import net.andrecarbajal.sysped.model.Order;
import net.andrecarbajal.sysped.model.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.Set;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByRestaurantTable_NumberAndStatusIn(Integer tableNumber, Set<OrderStatus> statuses);
}
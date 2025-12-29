package com.aiims.aimms_backend.repository;

import com.aiims.aimms_backend.model.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AlertRepository extends JpaRepository<Alert, Long> {
    List<Alert> findByStatus(Alert.AlertStatus status);

    List<Alert> findTop5ByOrderByTimestampDesc();

    void deleteByMessage(String message);
}

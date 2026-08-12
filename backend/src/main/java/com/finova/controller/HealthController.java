package com.finova.controller;

import com.finova.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    @Autowired
    private DataSource dataSource;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkHealth() {
        Map<String, Object> healthInfo = new HashMap<>();
        healthInfo.put("status", "UP");
        healthInfo.put("service", "Finova Backend API");
        
        try (Connection connection = dataSource.getConnection()) {
            healthInfo.put("database", "CONNECTED");
            healthInfo.put("dbCatalog", connection.getCatalog());
            healthInfo.put("dbProduct", connection.getMetaData().getDatabaseProductName());
        } catch (Exception e) {
            healthInfo.put("database", "DISCONNECTED: " + e.getMessage());
        }

        return ResponseEntity.ok(ApiResponse.success("Finova Service is healthy", healthInfo));
    }
}

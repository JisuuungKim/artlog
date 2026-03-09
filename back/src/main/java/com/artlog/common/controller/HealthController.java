package com.artlog.common.controller;

import com.artlog.common.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class HealthController {

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<Map<String, Object>>> health() {
        Map<String, Object> info = Map.of(
                "status", "UP",
                "timestamp", LocalDateTime.now().toString(),
                "service", "artlog-api"
        );
        return ResponseEntity.ok(ApiResponse.ok(info));
    }
}

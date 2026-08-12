package com.finova.controller;

import com.finova.dto.ApiResponse;
import com.finova.dto.GameSpinRequest;
import com.finova.dto.GameSpinResult;
import com.finova.security.CurrentUser;
import com.finova.security.UserPrincipal;
import com.finova.service.impl.GameService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/game")
public class GameController {

    @Autowired
    private GameService gameService;

    @PostMapping("/spin")
    public ResponseEntity<ApiResponse<GameSpinResult>> spin(
            @CurrentUser UserPrincipal currentUser,
            @Valid @RequestBody GameSpinRequest request) {
        GameSpinResult result = gameService.spin(currentUser.getId(), request);
        String message = result.getOutcome().equals("WIN")
                ? "🎉 Congratulations! You won!"
                : "Better luck next time!";
        return ResponseEntity.ok(ApiResponse.success(message, result));
    }
}

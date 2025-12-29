package com.aiims.aimms_backend.controller;

import com.aiims.aimms_backend.model.User;
import com.aiims.aimms_backend.repository.UserRepository;
import com.aiims.aimms_backend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserRepository repo;
    private final UserService userService;
    private final com.aiims.aimms_backend.config.JwtUtils jwtUtils;

    public UserController(UserRepository repo, UserService userService,
            com.aiims.aimms_backend.config.JwtUtils jwtUtils) {
        this.repo = repo;
        this.userService = userService;
        this.jwtUtils = jwtUtils;
    }

    @GetMapping("/ping")
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok("PONG");
    }

    @GetMapping
    public List<User> list() {
        return repo.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> get(@PathVariable Long id) {
        return repo.findById(id).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> payload) {
        try {
            User user = new User();
            user.setName(payload.get("name"));
            user.setEmail(payload.get("email"));
            user.setPhone(payload.get("phone"));
            // For now, store password as-is (TODO: hash in production)
            user.setPasswordHash(payload.get("password"));
            // Default role is USER (set in User entity)

            User saved = userService.saveUserWithSequentialId(user);

            // Return user with id field for frontend
            return ResponseEntity.ok(Map.of(
                    "id", saved.getUserId(),
                    "userId", saved.getUserId(),
                    "name", saved.getName(),
                    "email", saved.getEmail(),
                    "role", saved.getRole().toString()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Registration failed: " + e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> payload) {
        try {
            String email = payload.get("email");
            String password = payload.get("password");

            User user = repo.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

            // Check password (in production, use proper password hashing)
            if (!user.getPasswordHash().equals(password)) {
                return ResponseEntity.status(401).body(Map.of("message", "Invalid credentials"));
            }

            // Generate Token
            String token = jwtUtils.generateToken(user.getEmail());

            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "id", user.getUserId(),
                    "userId", user.getUserId(),
                    "name", user.getName(),
                    "email", user.getEmail(),
                    "role", user.getRole().toString()));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid credentials"));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}

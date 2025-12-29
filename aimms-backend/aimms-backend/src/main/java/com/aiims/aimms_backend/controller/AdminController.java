package com.aiims.aimms_backend.controller;

import com.aiims.aimms_backend.model.Admin;
import com.aiims.aimms_backend.model.User;
import com.aiims.aimms_backend.repository.AdminRepository;
import com.aiims.aimms_backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final AdminRepository adminRepo;
    private final UserRepository userRepo;
    private final com.aiims.aimms_backend.config.JwtUtils jwtUtils;

    public AdminController(AdminRepository adminRepo, UserRepository userRepo,
            com.aiims.aimms_backend.config.JwtUtils jwtUtils) {
        this.adminRepo = adminRepo;
        this.userRepo = userRepo;
        this.jwtUtils = jwtUtils;
    }

    @GetMapping("/list")
    public List<Admin> list() {
        return adminRepo.findAll();
    }

    @PostMapping("/create")
    public ResponseEntity<Admin> create(@RequestBody Admin a) {
        Admin saved = adminRepo.save(a);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> payload) {
        try {
            String email = payload.get("email");
            String password = payload.get("password");

            Admin admin = adminRepo.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

            // Check password (in production, use proper password hashing)
            if (!admin.getPasswordHash().equals(password)) {
                return ResponseEntity.status(401).body(Map.of("message", "Invalid credentials"));
            }

            // Generate Token
            String token = jwtUtils.generateToken(admin.getEmail());

            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "id", admin.getAdminId(),
                    "adminId", admin.getAdminId(),
                    "name", admin.getName(),
                    "email", admin.getEmail(),
                    "role", admin.getRole().toString()));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid credentials"));
        }
    }

    // User management endpoints for admins
    @GetMapping("/users")
    public List<User> getAllUsers() {
        return userRepo.findAll();
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/grant-sub-admin")
    public ResponseEntity<?> grantSubAdmin(@RequestBody Map<String, Object> payload) {
        try {
            Long userId = ((Number) payload.get("userId")).longValue();
            String permissions = (String) payload.get("permissions");
            String department = (String) payload.get("department");
            String reason = (String) payload.get("reason");
            String phone = (String) payload.get("phone");

            User user = userRepo.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));

            // Check if already admin
            if (adminRepo.findByEmail(user.getEmail()).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("message", "User is already an admin/sub-admin"));
            }

            Admin admin = new Admin();
            admin.setName(user.getName());
            admin.setEmail(user.getEmail());
            admin.setPasswordHash(user.getPasswordHash()); // Copy password
            admin.setRole(com.aiims.aimms_backend.model.Role.SUB_ADMIN);
            admin.setPermissions(permissions);
            admin.setDepartment(department);
            admin.setReason(reason);
            admin.setPhone(phone);

            adminRepo.save(admin);

            return ResponseEntity.ok(Map.of("message", "Sub-Admin access granted successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", "Failed to grant access: " + e.getMessage()));
        }
    }
}

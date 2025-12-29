package com.aiims.aimms_backend.service;

import com.aiims.aimms_backend.model.User;
import com.aiims.aimms_backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserService implements org.springframework.security.core.userdetails.UserDetailsService {

    private final UserRepository userRepository;
    private final com.aiims.aimms_backend.repository.AdminRepository adminRepository;

    public UserService(UserRepository userRepository,
            com.aiims.aimms_backend.repository.AdminRepository adminRepository) {
        this.userRepository = userRepository;
        this.adminRepository = adminRepository;
    }

    @Override
    public org.springframework.security.core.userdetails.UserDetails loadUserByUsername(String email)
            throws org.springframework.security.core.userdetails.UsernameNotFoundException {

        // 1. Try to find Admin first
        java.util.Optional<com.aiims.aimms_backend.model.Admin> adminOpt = adminRepository.findByEmail(email);
        if (adminOpt.isPresent()) {
            com.aiims.aimms_backend.model.Admin admin = adminOpt.get();
            return org.springframework.security.core.userdetails.User
                    .withUsername(admin.getEmail())
                    .password(admin.getPasswordHash())
                    .roles(admin.getRole().name())
                    .build();
        }

        // 2. Fallback to User
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new org.springframework.security.core.userdetails.UsernameNotFoundException(
                        "User not found with email: " + email));

        // Create UserDetails from User entity
        return org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password(user.getPasswordHash())
                .roles(user.getRole().name())
                .build();
    }

    /**
     * Finds the next available sequential user ID.
     * - If there are gaps in the sequence (e.g., 1, 2, 4, 5), returns the first gap
     * (3)
     * - If no gaps exist, returns maxId + 1
     * - If no users exist, returns 1
     */
    @Transactional
    public Long getNextSequentialUserId() {
        List<Long> existingIds = userRepository.findAllUserIds();

        // If no users exist, start from 1
        if (existingIds.isEmpty()) {
            return 1L;
        }

        // Find the first gap in the sequence
        for (int i = 0; i < existingIds.size(); i++) {
            long expectedId = i + 1;
            if (existingIds.get(i) != expectedId) {
                // Found a gap, return the missing ID
                return expectedId;
            }
        }

        // No gaps found, return next sequential number
        return (long) existingIds.size() + 1;
    }

    /**
     * Saves a user with the next sequential ID.
     */
    @Transactional
    public User saveUserWithSequentialId(User user) {
        if (user.getUserId() == null) {
            user.setUserId(getNextSequentialUserId());
        }
        return userRepository.save(user);
    }
}

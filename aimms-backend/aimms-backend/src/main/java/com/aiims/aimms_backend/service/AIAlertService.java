package com.aiims.aimms_backend.service;

import com.aiims.aimms_backend.model.Alert;
import com.aiims.aimms_backend.model.Budget;
import com.aiims.aimms_backend.model.Transaction;
import com.aiims.aimms_backend.repository.AlertRepository;
import com.aiims.aimms_backend.repository.BudgetRepository;
import com.aiims.aimms_backend.repository.TransactionRepository;
import jakarta.annotation.PostConstruct;
import jakarta.transaction.Transactional;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

@Service
public class AIAlertService {

    private final AlertRepository alertRepo;
    private final BudgetRepository budgetRepo;
    private final TransactionRepository transactionRepo;
    private final Random random = new Random();

    public AIAlertService(AlertRepository alertRepo, BudgetRepository budgetRepo,
            TransactionRepository transactionRepo) {
        this.alertRepo = alertRepo;
        this.budgetRepo = budgetRepo;
        this.transactionRepo = transactionRepo;
    }

    @PostConstruct
    @Transactional
    public void cleanupDemoData() {
        System.out.println("🧹 Cleaning up legacy demo alerts...");
        try {
            alertRepo.deleteByMessage("Projected Overspending Detected for 12 Users");
            alertRepo.deleteByMessage("Unusual API Latency Pattern");
            alertRepo.deleteByMessage("Categorization Model Confidence Drop");
        } catch (Exception e) {
            System.err.println("⚠️ Failed to clean up demo alerts: " + e.getMessage());
        }
    }

    // Run every 5 minutes (300000 ms)
    @Scheduled(fixedRate = 300000)
    public void runAIAnalysis() {
        System.out.println("🤖 AI Alert System: Starting analysis cycle...");
        analyzeFinancialRisks();
        // monitorSystemHealth(); // Disabled simulation
        // monitorModelperformance(); // Disabled simulation
    }

    private void analyzeFinancialRisks() {
        List<Budget> allBudgets = budgetRepo.findAll();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfMonth = now.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        int daysInMonth = now.toLocalDate().lengthOfMonth();
        int daysPassed = now.getDayOfMonth();

        // Avoid division by zero on day 1 (just treat as 1 day passed)
        if (daysPassed == 0)
            daysPassed = 1;

        for (Budget budget : allBudgets) {
            // Fetch transactions for this user in current month
            List<Transaction> transactions = transactionRepo.findByUserUserIdAndTxnDateBetween(
                    budget.getUser().getUserId(),
                    startOfMonth,
                    now);

            // Calculate total spent for this budget category
            double totalSpent = transactions.stream()
                    .filter(t -> {
                        String catName = t.getCategory() != null ? t.getCategory().getName() : t.getPredictedCategory();
                        return catName != null && catName.equalsIgnoreCase(budget.getName());
                    })
                    .mapToDouble(Transaction::getAmount)
                    .sum();

            double limit = budget.getLimitAmount();
            if (limit <= 0)
                continue; // Skip zero/invalid budgets

            // Calculate Burn Rate (Daily Average)
            double dailyBurnRate = totalSpent / daysPassed;

            // Project Month End Spend
            double projectedSpend = dailyBurnRate * daysInMonth;

            // Threshold: If projected spend > limit AND we are not at the very end of month
            // (e.g. < day 28)
            // Or simply if projected > limit
            if (projectedSpend > limit && totalSpent < limit) {
                // Ensure sufficient data for projection (e.g. at least 5 days passed or
                // significant spend)
                if (daysPassed > 5 || totalSpent > (limit * 0.5)) {
                    int excessPercent = (int) ((projectedSpend / limit) * 100);

                    String message = "Projected Overspending: " + budget.getName();
                    String explanation = String.format(
                            "User %s is on track to exceed their '%s' budget. Current spend: %.2f. Projected: %.2f (%d%% of limit).",
                            budget.getUser().getName(),
                            budget.getName(),
                            totalSpent,
                            projectedSpend,
                            excessPercent);

                    createAlert(
                            Alert.AlertType.FINANCIAL,
                            Alert.AlertSeverity.HIGH,
                            message,
                            explanation,
                            85 + random.nextInt(10) // Mock confidence for now or calculate based on variance
                    );
                }
            } else if (totalSpent >= limit) {
                // Already exceeded
                createAlert(
                        Alert.AlertType.FINANCIAL,
                        Alert.AlertSeverity.CRITICAL,
                        "Budget Exceeded: " + budget.getName(),
                        String.format("User %s has exceeded their '%s' budget. Limit: %.2f, Spent: %.2f",
                                budget.getUser().getName(), budget.getName(), limit, totalSpent),
                        99);
            }
        }
    }

    /*
     * private void monitorSystemHealth() {
     * // Disabled Simulation
     * }
     * 
     * private void monitorModelperformance() {
     * // Disabled Simulation
     * }
     */

    public void createAlert(Alert.AlertType type, Alert.AlertSeverity severity, String message, String explanation,
            int confidence) {
        // Prevent duplicate spam: Check if similar active alert exists for today
        List<Alert> active = alertRepo.findByStatus(Alert.AlertStatus.ACTIVE);
        boolean exists = active.stream().anyMatch(a -> a.getMessage().equals(message) &&
                a.getTimestamp().toLocalDate().equals(LocalDateTime.now().toLocalDate()));

        if (!exists) {
            Alert alert = new Alert();
            alert.setType(type);
            alert.setSeverity(severity);
            alert.setMessage(message);
            alert.setAiExplanation(explanation);
            alert.setConfidenceScore(confidence);
            alert.setTimestamp(LocalDateTime.now());
            alertRepo.save(alert);
            System.out.println("🚨 New Alert Generated: " + message);
        }
    }
}

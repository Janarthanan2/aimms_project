package com.aiims.aimms_backend.service.impl;

import com.aiims.aimms_backend.dto.GoalPredictionResponse;
import com.aiims.aimms_backend.model.Goal;
import com.aiims.aimms_backend.model.Transaction;
import com.aiims.aimms_backend.repository.GoalRepository;
import com.aiims.aimms_backend.repository.TransactionRepository;
import com.aiims.aimms_backend.service.GoalPredictionService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class GoalPredictionServiceImpl implements GoalPredictionService {

    private final GoalRepository goalRepository;
    private final TransactionRepository transactionRepository;
    private final WebClient webClient;

    public GoalPredictionServiceImpl(GoalRepository goalRepository,
            TransactionRepository transactionRepository,
            WebClient.Builder webClientBuilder,
            @Value("${model.service.url}") String modelServiceUrl) {
        this.goalRepository = goalRepository;
        this.transactionRepository = transactionRepository;
        this.webClient = webClientBuilder.baseUrl(modelServiceUrl).build();
    }

    @Override
    public Mono<GoalPredictionResponse> predictGoalCompletion(Long goalId, Long userId) {
        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new RuntimeException("Goal not found"));

        if (!goal.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized access to goal");
        }

        List<Transaction> transactions = transactionRepository.findAllByUserUserId(userId);

        // Construct Request Payload
        Map<String, Object> request = new HashMap<>();
        request.put("goal_target", goal.getTargetAmount());
        request.put("goal_current", goal.getCurrentAmount());
        request.put("goal_deadline", goal.getDeadline() != null ? goal.getDeadline().toString() : "");
        request.put("goal_created_at", goal.getCreatedAt() != null ? goal.getCreatedAt().toString() : "");

        List<Map<String, Object>> txnList = transactions.stream().map(t -> {
            Map<String, Object> map = new HashMap<>();
            map.put("date", t.getTxnDate().toLocalDate().toString());
            map.put("amount", t.getAmount());
            map.put("category", t.getCategory() != null ? t.getCategory().getName() : "Uncategorized");

            // Determine type Credit/Debit
            String type = "Debit";
            if (t.getCategory() != null && "INCOME".equalsIgnoreCase(t.getCategory().getType())) {
                type = "Credit";
            }
            map.put("type", type);
            return map;
        }).collect(Collectors.toList());

        request.put("transactions", txnList);

        return webClient.post()
                .uri("/predict_goal_completion")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(GoalPredictionResponse.class);
    }
}

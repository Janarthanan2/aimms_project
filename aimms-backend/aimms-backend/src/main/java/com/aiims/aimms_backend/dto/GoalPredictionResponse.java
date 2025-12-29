package com.aiims.aimms_backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class GoalPredictionResponse {
    @JsonProperty("predicted_completion_date")
    private String predictedCompletionDate;

    @JsonProperty("daily_savings_estimate")
    private Double dailySavingsEstimate;

    @JsonProperty("required_daily_savings")
    private Double requiredDailySavings;

    @JsonProperty("on_track")
    private Boolean onTrack;

    @JsonProperty("suggested_daily_cut")
    private Double suggestedDailyCut;
}

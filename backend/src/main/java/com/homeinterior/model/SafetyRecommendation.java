package com.homeinterior.model;

public class SafetyRecommendation {
    private String category;
    private String recommendation;
    private boolean required;

    public SafetyRecommendation(String category, String recommendation, boolean required) {
        this.category = category;
        this.recommendation = recommendation;
        this.required = required;
    }

    public String getCategory() { return category; }
    public String getRecommendation() { return recommendation; }
    public boolean isRequired() { return required; }
}

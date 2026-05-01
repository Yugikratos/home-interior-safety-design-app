package com.homeinterior.model;

public class SafetyRecommendation {
    private String category;
    private String recommendation;
    private boolean required;
    private String priority;
    private String explanation;

    public SafetyRecommendation(String category, String recommendation, boolean required) {
        this(category, recommendation, required, required ? "High" : "Low", recommendation);
    }

    public SafetyRecommendation(String category, String recommendation, boolean required, String priority, String explanation) {
        this.category = category;
        this.recommendation = recommendation;
        this.required = required;
        this.priority = priority;
        this.explanation = explanation;
    }

    public String getCategory() { return category; }
    public String getRecommendation() { return recommendation; }
    public boolean isRequired() { return required; }
    public String getPriority() { return priority; }
    public String getExplanation() { return explanation; }
}

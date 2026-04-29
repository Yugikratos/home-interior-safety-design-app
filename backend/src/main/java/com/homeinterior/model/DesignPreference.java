package com.homeinterior.model;

import jakarta.persistence.*;

@Entity
public class DesignPreference {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String style;
    @Column(nullable = false)
    private String budget;
    private String colorPalette;
    @OneToOne(optional = false)
    private Project project;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getStyle() { return style; }
    public void setStyle(String style) { this.style = style; }
    public String getBudget() { return budget; }
    public void setBudget(String budget) { this.budget = budget; }
    public String getColorPalette() { return colorPalette; }
    public void setColorPalette(String colorPalette) { this.colorPalette = colorPalette; }
    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }
}

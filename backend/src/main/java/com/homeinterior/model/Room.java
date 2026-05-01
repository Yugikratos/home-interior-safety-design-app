package com.homeinterior.model;

import jakarta.persistence.*;

@Entity
public class Room {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String name;
    @Column(nullable = false)
    private String type;
    @Column(nullable = false)
    private double length;
    @Column(nullable = false)
    private double width;
    private Double mapX;
    private Double mapY;
    private Double mapWidth;
    private Double mapHeight;
    @ManyToOne(optional = false)
    private Project project;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public double getLength() { return length; }
    public void setLength(double length) { this.length = length; }
    public double getWidth() { return width; }
    public void setWidth(double width) { this.width = width; }
    public Double getMapX() { return mapX; }
    public void setMapX(Double mapX) { this.mapX = mapX; }
    public Double getMapY() { return mapY; }
    public void setMapY(Double mapY) { this.mapY = mapY; }
    public Double getMapWidth() { return mapWidth; }
    public void setMapWidth(Double mapWidth) { this.mapWidth = mapWidth; }
    public Double getMapHeight() { return mapHeight; }
    public void setMapHeight(Double mapHeight) { this.mapHeight = mapHeight; }
    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }
}

package com.homeinterior.model;

import jakarta.persistence.*;

@Entity
public class FurnitureItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String type;
    @Column(nullable = false)
    private double xPercent;
    @Column(nullable = false)
    private double yPercent;
    @Column(nullable = false)
    private double widthPercent;
    @Column(nullable = false)
    private double heightPercent;
    @Column(nullable = false)
    private double rotationAngle;
    @ManyToOne(optional = false)
    private Room room;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public double getXPercent() { return xPercent; }
    public void setXPercent(double xPercent) { this.xPercent = xPercent; }
    public double getYPercent() { return yPercent; }
    public void setYPercent(double yPercent) { this.yPercent = yPercent; }
    public double getWidthPercent() { return widthPercent; }
    public void setWidthPercent(double widthPercent) { this.widthPercent = widthPercent; }
    public double getHeightPercent() { return heightPercent; }
    public void setHeightPercent(double heightPercent) { this.heightPercent = heightPercent; }
    public double getRotationAngle() { return rotationAngle; }
    public void setRotationAngle(double rotationAngle) { this.rotationAngle = rotationAngle; }
    public Room getRoom() { return room; }
    public void setRoom(Room room) { this.room = room; }
}

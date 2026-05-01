package com.homeinterior.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public class AppProperties {
    private String jwtSecret;
    private long jwtExpirationMs;
    private String uploadDir;
    private String frontendOrigin;
    private String blueprintProcessorUrl;

    public String getJwtSecret() { return jwtSecret; }
    public void setJwtSecret(String jwtSecret) { this.jwtSecret = jwtSecret; }
    public long getJwtExpirationMs() { return jwtExpirationMs; }
    public void setJwtExpirationMs(long jwtExpirationMs) { this.jwtExpirationMs = jwtExpirationMs; }
    public String getUploadDir() { return uploadDir; }
    public void setUploadDir(String uploadDir) { this.uploadDir = uploadDir; }
    public String getFrontendOrigin() { return frontendOrigin; }
    public void setFrontendOrigin(String frontendOrigin) { this.frontendOrigin = frontendOrigin; }
    public String getBlueprintProcessorUrl() { return blueprintProcessorUrl; }
    public void setBlueprintProcessorUrl(String blueprintProcessorUrl) { this.blueprintProcessorUrl = blueprintProcessorUrl; }
}

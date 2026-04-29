package com.homeinterior;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
class HomeInteriorSafetyDesignApplicationTests {
    @Autowired
    MockMvc mockMvc;

    @Test
    void contextLoads() {
    }

    @Test
    void registerRejectsInvalidEmail() throws Exception {
        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Test User","email":"not-an-email","password":"password123"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation failed"));
    }

    @Test
    void registerRejectsDuplicateEmail() throws Exception {
        String email = "duplicate@example.com";
        register("Duplicate User", email, "password123");

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Duplicate User","email":"duplicate@example.com","password":"password123"}
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("Email is already registered"));
    }

    @Test
    void projectAccessIsScopedToOwner() throws Exception {
        String ownerToken = register("Owner", "owner@example.com", "password123");
        String otherToken = register("Other", "other@example.com", "password123");

        MvcResult created = mockMvc.perform(post("/projects")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Owner Project","description":"Private project"}
                                """))
                .andExpect(status().isCreated())
                .andReturn();

        String projectId = extractNumber(created.getResponse().getContentAsString(), "id");

        mockMvc.perform(get("/projects/" + projectId)
                        .header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Project not found"));
    }

    @Test
    void blueprintUploadRejectsUnsupportedFileType() throws Exception {
        String token = register("Uploader", "uploader@example.com", "password123");
        MvcResult created = mockMvc.perform(post("/projects")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Upload Project","description":"Upload test"}
                                """))
                .andExpect(status().isCreated())
                .andReturn();
        String projectId = extractNumber(created.getResponse().getContentAsString(), "id");
        MockMultipartFile file = new MockMultipartFile("file", "blueprint.txt", "text/plain", "bad".getBytes());

        mockMvc.perform(multipart("/projects/" + projectId + "/blueprint")
                        .file(file)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("Blueprint must be")));
    }

    private String register(String name, String email, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"%s","email":"%s","password":"%s"}
                                """.formatted(name, email, password)))
                .andExpect(status().isCreated())
                .andReturn();
        return extractString(result.getResponse().getContentAsString(), "token");
    }

    private String extractString(String json, String field) {
        String marker = "\"" + field + "\":\"";
        int start = json.indexOf(marker) + marker.length();
        int end = json.indexOf("\"", start);
        return json.substring(start, end);
    }

    private String extractNumber(String json, String field) {
        String marker = "\"" + field + "\":";
        int start = json.indexOf(marker) + marker.length();
        int end = json.indexOf(",", start);
        if (end == -1) {
            end = json.indexOf("}", start);
        }
        return json.substring(start, end);
    }
}

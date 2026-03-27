package com.gr1.exam.module.exam.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gr1.exam.core.security.JwtAuthenticationFilter;
import com.gr1.exam.module.exam.controller.ExamController;
import com.gr1.exam.module.exam.dto.ExamParticipantDTO;
import com.gr1.exam.module.exam.dto.ExamRequestDTO;
import com.gr1.exam.module.exam.dto.ExamResponseDTO;
import com.gr1.exam.module.exam.service.ExamService;
import com.gr1.exam.module.user.dto.UserResponseDTO;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = ExamController.class)
@AutoConfigureMockMvc(addFilters = false)
class ExamModuleWebMvcTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ExamService examService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Test
    void createExam_shouldReturn201() throws Exception {
        ExamRequestDTO request = new ExamRequestDTO();
        request.setTitle("Final Test");
        request.setSubjectId(1);
        request.setDuration(60);
        request.setTotalQuestions(30);
        request.setStartTime(LocalDateTime.now().plusDays(1));
        request.setEndTime(LocalDateTime.now().plusDays(1).plusHours(2));

        ExamResponseDTO response = ExamResponseDTO.builder()
                .id(1)
                .title("Final Test")
                .subjectId(1)
                .subjectName("Toan")
                .duration(60)
                .totalQuestions(30)
                .status("UPCOMING")
                .participantCount(0L)
                .build();

        when(examService.createExam(any(ExamRequestDTO.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/exams")
                        .contextPath("/api/v1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.title").value("Final Test"));
    }

    @Test
    void createExam_shouldReturn400_whenValidationFails() throws Exception {
        String invalidJson = "{\"title\":\"\",\"subjectId\":1,\"duration\":0,\"totalQuestions\":0}";

        mockMvc.perform(post("/api/v1/exams")
                        .contextPath("/api/v1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getAllExams_shouldReturn200() throws Exception {
        when(examService.getAllExams()).thenReturn(List.of(
                ExamResponseDTO.builder().id(1).title("E1").build(),
                ExamResponseDTO.builder().id(2).title("E2").build()
        ));

        mockMvc.perform(get("/api/v1/exams").contextPath("/api/v1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("E1"))
                .andExpect(jsonPath("$[1].title").value("E2"));
    }

    @Test
    void updateExam_shouldReturn200() throws Exception {
        ExamRequestDTO request = new ExamRequestDTO();
        request.setTitle("Updated Exam");
        request.setSubjectId(1);
        request.setDuration(45);
        request.setTotalQuestions(20);

        when(examService.updateExam(any(Integer.class), any(ExamRequestDTO.class)))
                .thenReturn(ExamResponseDTO.builder().id(3).title("Updated Exam").build());

        mockMvc.perform(put("/api/v1/exams/3")
                        .contextPath("/api/v1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Updated Exam"));
    }

    @Test
    void addParticipant_shouldReturn201() throws Exception {
        ExamParticipantDTO request = new ExamParticipantDTO();
        request.setUserId(5);

        doNothing().when(examService).addParticipant(any(Integer.class), any(ExamParticipantDTO.class));

        mockMvc.perform(post("/api/v1/exams/1/participants")
                        .contextPath("/api/v1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    @Test
    void getParticipants_shouldReturn200WithUsers() throws Exception {
        when(examService.getParticipants(1)).thenReturn(List.of(
                UserResponseDTO.builder().id(10).name("student1").role("STUDENT").build()
        ));

        mockMvc.perform(get("/api/v1/exams/1/participants").contextPath("/api/v1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("student1"));
    }

    @Test
    void deleteExam_shouldReturn204() throws Exception {
        doNothing().when(examService).deleteExam(9);

        mockMvc.perform(delete("/api/v1/exams/9").contextPath("/api/v1"))
                .andExpect(status().isNoContent());
    }
}

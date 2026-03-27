package com.gr1.exam.module.exam.controller;

import com.gr1.exam.module.exam.dto.ExamParticipantDTO;
import com.gr1.exam.module.exam.dto.ExamRequestDTO;
import com.gr1.exam.module.exam.dto.ExamResponseDTO;
import com.gr1.exam.module.exam.service.ExamService;
import com.gr1.exam.module.user.dto.UserResponseDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller cho Kỳ thi.
 * Endpoints: /exams/**
 * (Prefix /api/v1 được thêm bởi context-path)
 */
@RestController
@RequestMapping("/exams")
@RequiredArgsConstructor
public class ExamController {

    private final ExamService examService;

    // ==================== CRUD Kỳ thi ====================

    /**
     * GET /api/v1/exams — Danh sách kỳ thi (Authenticated).
     */
    @GetMapping
    public ResponseEntity<List<ExamResponseDTO>> getAllExams() {
        return ResponseEntity.ok(examService.getAllExams());
    }

    /**
     * GET /api/v1/exams/{id} — Chi tiết kỳ thi (Authenticated).
     */
    @GetMapping("/{id}")
    public ResponseEntity<ExamResponseDTO> getExamById(@PathVariable Integer id) {
        return ResponseEntity.ok(examService.getExamById(id));
    }

    /**
     * POST /api/v1/exams — Tạo kỳ thi mới (ADMIN).
     */
    @PostMapping
    public ResponseEntity<ExamResponseDTO> createExam(@Valid @RequestBody ExamRequestDTO request) {
        ExamResponseDTO response = examService.createExam(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * PUT /api/v1/exams/{id} — Cập nhật kỳ thi (ADMIN).
     */
    @PutMapping("/{id}")
    public ResponseEntity<ExamResponseDTO> updateExam(@PathVariable Integer id,
                                                       @Valid @RequestBody ExamRequestDTO request) {
        return ResponseEntity.ok(examService.updateExam(id, request));
    }

    /**
     * DELETE /api/v1/exams/{id} — Xoá kỳ thi (ADMIN).
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExam(@PathVariable Integer id) {
        examService.deleteExam(id);
        return ResponseEntity.noContent().build();
    }

    // ==================== Quản lý Thí sinh ====================

    /**
     * POST /api/v1/exams/{id}/participants — Thêm thí sinh (ADMIN).
     */
    @PostMapping("/{id}/participants")
    public ResponseEntity<Void> addParticipant(@PathVariable Integer id,
                                                @Valid @RequestBody ExamParticipantDTO request) {
        examService.addParticipant(id, request);
        return new ResponseEntity<>(HttpStatus.CREATED);
    }

    /**
     * GET /api/v1/exams/{id}/participants — Danh sách thí sinh (ADMIN).
     */
    @GetMapping("/{id}/participants")
    public ResponseEntity<List<UserResponseDTO>> getParticipants(@PathVariable Integer id) {
        return ResponseEntity.ok(examService.getParticipants(id));
    }
}

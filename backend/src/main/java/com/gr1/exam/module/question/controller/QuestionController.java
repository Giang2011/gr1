package com.gr1.exam.module.question.controller;

import com.gr1.exam.module.question.dto.QuestionRequestDTO;
import com.gr1.exam.module.question.dto.QuestionResponseDTO;
import com.gr1.exam.module.question.service.QuestionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller cho Câu hỏi.
 * Endpoints: /questions/**
 * (Prefix /api/v1 được thêm bởi context-path)
 */
@RestController
@RequestMapping("/questions")
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionService questionService;

    /**
     * GET /api/v1/questions — Danh sách câu hỏi (filter + phân trang).
     * Query params: subjectId, keyword, page (default 0), size (default 20)
     */
    @GetMapping
    public ResponseEntity<Page<QuestionResponseDTO>> getAllQuestions(
            @RequestParam(required = false) Integer subjectId,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(questionService.getAllQuestions(subjectId, keyword, pageable));
    }

    /**
     * GET /api/v1/questions/{id} — Chi tiết câu hỏi + answers.
     */
    @GetMapping("/{id}")
    public ResponseEntity<QuestionResponseDTO> getQuestionById(@PathVariable Integer id) {
        return ResponseEntity.ok(questionService.getQuestionById(id));
    }

    /**
     * POST /api/v1/questions — Tạo câu hỏi + đáp án (ADMIN).
     */
    @PostMapping
    public ResponseEntity<QuestionResponseDTO> createQuestion(@Valid @RequestBody QuestionRequestDTO request) {
        QuestionResponseDTO response = questionService.createQuestion(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * PUT /api/v1/questions/{id} — Cập nhật câu hỏi + đáp án (ADMIN).
     */
    @PutMapping("/{id}")
    public ResponseEntity<QuestionResponseDTO> updateQuestion(@PathVariable Integer id,
                                                               @Valid @RequestBody QuestionRequestDTO request) {
        return ResponseEntity.ok(questionService.updateQuestion(id, request));
    }

    /**
     * DELETE /api/v1/questions/{id} — Xoá câu hỏi (ADMIN).
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuestion(@PathVariable Integer id) {
        questionService.deleteQuestion(id);
        return ResponseEntity.noContent().build();
    }
}

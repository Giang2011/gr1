package com.gr1.exam.module.session.controller;

import com.gr1.exam.module.session.dto.ExamQuestionResponseDTO;
import com.gr1.exam.module.session.dto.ExamSessionResponseDTO;
import com.gr1.exam.module.session.dto.SubmitSessionRequestDTO;
import com.gr1.exam.module.session.dto.UserAnswerRequestDTO;
import com.gr1.exam.module.session.service.ExamSessionService;
import com.gr1.exam.module.user.entity.User;
import com.gr1.exam.module.user.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class ExamSessionController {

    private final ExamSessionService examSessionService;
    private final UserRepository userRepository;

    /**
     * POST /api/sessions/start/{examId} — Bắt đầu phiên thi (sinh đề xáo trộn).
     */
    @PostMapping("/start/{examId}")
    public ResponseEntity<ExamSessionResponseDTO> startSession(@PathVariable Integer examId) {
        Integer userId = getCurrentUserId();
        ExamSessionResponseDTO response = examSessionService.startSession(examId, userId);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/sessions/{id}/questions — Lấy đề thi đã xáo trộn.
     */
    @GetMapping("/{id}/questions")
    public ResponseEntity<List<ExamQuestionResponseDTO>> getQuestions(@PathVariable Integer id) {
        Integer userId = getCurrentUserId();
        List<ExamQuestionResponseDTO> questions = examSessionService.getShuffledQuestions(id, userId);
        return ResponseEntity.ok(questions);
    }

    /**
     * POST /api/sessions/{id}/answers — Gửi đáp án đã chọn (lưu realtime).
     */
    @Deprecated
    @PostMapping("/{id}/answers")
    public ResponseEntity<Void> saveAnswer(@PathVariable Integer id,
            @Valid @RequestBody UserAnswerRequestDTO dto) {
        Integer userId = getCurrentUserId();
        examSessionService.saveAnswer(id, userId, dto);
        return ResponseEntity.ok().build();
    }

    /**
     * POST /api/sessions/{id}/submit — Nộp bài thi.
     */
    @PostMapping("/{id}/submit")
    public ResponseEntity<ExamSessionResponseDTO> submitSession(@PathVariable Integer id,
            @Valid @RequestBody SubmitSessionRequestDTO dto) {
        Integer userId = getCurrentUserId();
        ExamSessionResponseDTO response = examSessionService.submitSession(id, userId, dto);
        return ResponseEntity.ok(response);
    }

    // ==================== Helper ====================

    /**
     * Lấy ID user hiện tại từ SecurityContext.
     */
    private Integer getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User user = userRepository.findByName(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user: " + username));
        return user.getId();
    }
}

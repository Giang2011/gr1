package com.gr1.exam.module.session.service;

import com.gr1.exam.core.exception.BadRequestException;
import com.gr1.exam.core.exception.ResourceNotFoundException;
import com.gr1.exam.core.utils.ShuffleUtils;
import com.gr1.exam.module.exam.entity.Exam;
import com.gr1.exam.module.exam.repository.ExamParticipantRepository;
import com.gr1.exam.module.exam.repository.ExamRepository;
import com.gr1.exam.module.grading.service.GradingService;
import com.gr1.exam.module.question.entity.Answer;
import com.gr1.exam.module.question.entity.Question;
import com.gr1.exam.module.question.repository.AnswerRepository;
import com.gr1.exam.module.question.repository.QuestionRepository;
import com.gr1.exam.module.session.dto.ExamQuestionResponseDTO;
import com.gr1.exam.module.session.dto.ExamSessionResponseDTO;
import com.gr1.exam.module.session.dto.QuestionAnswerSubmissionDTO;
import com.gr1.exam.module.session.dto.SubmitSessionRequestDTO;
import com.gr1.exam.module.session.dto.UserAnswerRequestDTO;
import com.gr1.exam.module.session.entity.ExamAnswer;
import com.gr1.exam.module.session.entity.ExamQuestion;
import com.gr1.exam.module.session.entity.ExamSession;
import com.gr1.exam.module.session.entity.UserAnswer;
import com.gr1.exam.module.session.entity.UserAnswerSelection;
import com.gr1.exam.module.session.repository.ExamAnswerRepository;
import com.gr1.exam.module.session.repository.ExamQuestionRepository;
import com.gr1.exam.module.session.repository.ExamSessionRepository;
import com.gr1.exam.module.session.repository.UserAnswerRepository;
import com.gr1.exam.module.user.entity.User;
import com.gr1.exam.module.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * ★ Service cốt lõi: Quản lý phiên thi, sinh mã đề, xáo trộn, nộp bài. ★
 */
@Service
@RequiredArgsConstructor
public class ExamSessionService {

    private final ExamSessionRepository examSessionRepository;
    private final ExamQuestionRepository examQuestionRepository;
    private final ExamAnswerRepository examAnswerRepository;
    private final UserAnswerRepository userAnswerRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final ExamRepository examRepository;
    private final ExamParticipantRepository examParticipantRepository;
    private final UserRepository userRepository;
    private final GradingService gradingService;

    @Transactional
    public ExamSessionResponseDTO startSession(Integer examId, Integer userId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Kỳ thi không tìm thấy với id: " + examId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User không tìm thấy với id: " + userId));

        validateExamOngoing(exam);

        if (!examParticipantRepository.existsByExamIdAndUserId(examId, userId)) {
            throw new BadRequestException("User không thuộc danh sách thí sinh của kỳ thi này.");
        }

        examSessionRepository.findByExamIdAndUserIdAndStatus(examId, userId, ExamSession.Status.DOING)
                .ifPresent(s -> {
                    throw new BadRequestException("Bạn đã có phiên thi đang diễn ra cho kỳ thi này.");
                });

        ExamSession session = ExamSession.builder()
                .exam(exam)
                .user(user)
                .build();
        session = examSessionRepository.save(session);

        List<Question> allQuestions = questionRepository.findBySubjectId(exam.getSubject().getId());
        if (allQuestions.size() < exam.getTotalQuestions()) {
            throw new BadRequestException(
                    "Ngân hàng câu hỏi không đủ. Cần " + exam.getTotalQuestions()
                            + " câu, hiện có " + allQuestions.size() + " câu.");
        }

        List<Question> shuffledQuestions = ShuffleUtils.shuffle(allQuestions);
        List<Question> selectedQuestions = shuffledQuestions.subList(0, exam.getTotalQuestions());

        for (int i = 0; i < selectedQuestions.size(); i++) {
            Question question = selectedQuestions.get(i);

            ExamQuestion examQuestion = ExamQuestion.builder()
                    .examSession(session)
                    .question(question)
                    .orderIndex(i + 1)
                    .build();
            examQuestion = examQuestionRepository.save(examQuestion);

            List<Answer> answers = answerRepository.findByQuestionId(question.getId());
            List<Answer> shuffledAnswers = ShuffleUtils.shuffle(answers);

            for (int j = 0; j < shuffledAnswers.size(); j++) {
                ExamAnswer examAnswer = ExamAnswer.builder()
                        .examQuestion(examQuestion)
                        .answer(shuffledAnswers.get(j))
                        .orderIndex(j)
                        .build();
                examAnswerRepository.save(examAnswer);
            }
        }

        return toSessionResponseDTO(session);
    }

    public List<ExamQuestionResponseDTO> getShuffledQuestions(Integer sessionId, Integer userId) {
        ExamSession session = getValidDoingSession(sessionId, userId);

        List<ExamQuestion> examQuestions = examQuestionRepository
                .findByExamSessionIdOrderByOrderIndex(session.getId());

        List<ExamQuestionResponseDTO> result = new ArrayList<>();
        for (ExamQuestion eq : examQuestions) {
            List<ExamAnswer> examAnswers = examAnswerRepository
                    .findByExamQuestionIdOrderByOrderIndex(eq.getId());

            List<ExamQuestionResponseDTO.ShuffledAnswerDTO> answerDTOs = new ArrayList<>();
            for (ExamAnswer ea : examAnswers) {
                answerDTOs.add(ExamQuestionResponseDTO.ShuffledAnswerDTO.builder()
                        .examAnswerId(ea.getId())
                        .orderIndex(ea.getOrderIndex())
                        .content(ea.getAnswer().getContent())
                        .build());
            }

            long correctCount = eq.getQuestion().getAnswers().stream()
                    .filter(a -> a.getIsCorrect() != null && a.getIsCorrect())
                    .count();
            boolean isMultipleChoice = correctCount > 1;

            result.add(ExamQuestionResponseDTO.builder()
                    .examQuestionId(eq.getId())
                    .orderIndex(eq.getOrderIndex())
                    .content(eq.getQuestion().getContent())
                    .isMultipleChoice(isMultipleChoice)
                    .answers(answerDTOs)
                    .build());
        }

        return result;
    }

    /**
     * Endpoint compatibility mode: lưu 1 lựa chọn cho 1 câu hỏi.
     */
    @Transactional
    public void saveAnswer(Integer sessionId, Integer userId, UserAnswerRequestDTO dto) {
        ExamSession session = getValidDoingSession(sessionId, userId);

        ExamQuestion examQuestion = examQuestionRepository.findById(dto.getExamQuestionId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Câu hỏi không tìm thấy với id: " + dto.getExamQuestionId()));

        if (!examQuestion.getExamSession().getId().equals(session.getId())) {
            throw new BadRequestException("Câu hỏi không thuộc phiên thi này.");
        }

        List<Integer> selectedIds = new ArrayList<>();
        if (dto.getSelectedExamAnswerId() != null) {
            selectedIds.add(dto.getSelectedExamAnswerId());
        }

        upsertAnswerSelection(examQuestion, selectedIds);
    }

    @Transactional
    public ExamSessionResponseDTO submitSession(Integer sessionId, Integer userId, SubmitSessionRequestDTO dto) {
        ExamSession session = examSessionRepository.findByIdAndUserIdForUpdate(sessionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Phiên thi không tìm thấy với id: " + sessionId));

        if (session.getStatus() == ExamSession.Status.SUBMITTED) {
            throw new BadRequestException("Phiên thi đã được nộp trước đó.");
        }

        saveSubmittedAnswers(session, dto);

        session.setStatus(ExamSession.Status.SUBMITTED);
        session.setEndTime(LocalDateTime.now());
        session = examSessionRepository.save(session);

        gradingService.grade(sessionId);

        return toSessionResponseDTO(session);
    }

    private void saveSubmittedAnswers(ExamSession session, SubmitSessionRequestDTO dto) {
        List<ExamQuestion> examQuestions = examQuestionRepository.findByExamSessionIdOrderByOrderIndex(session.getId());

        Map<Integer, ExamQuestion> questionById = examQuestions.stream()
                .collect(Collectors.toMap(ExamQuestion::getId, q -> q));

        Map<Integer, List<Integer>> submittedSelectionsByQuestion = new HashMap<>();
        Set<Integer> uniqueQuestionIds = new HashSet<>();

        for (QuestionAnswerSubmissionDTO answer : dto.getAnswers()) {
            Integer questionId = answer.getExamQuestionId();
            if (!uniqueQuestionIds.add(questionId)) {
                throw new BadRequestException("Danh sách submit chứa câu hỏi bị lặp: " + questionId);
            }
            if (!questionById.containsKey(questionId)) {
                throw new BadRequestException("Câu hỏi không thuộc phiên thi: " + questionId);
            }

            submittedSelectionsByQuestion.put(questionId,
                    answer.getSelectedExamAnswerIds() == null ? new ArrayList<>() : answer.getSelectedExamAnswerIds());
        }

        for (ExamQuestion examQuestion : examQuestions) {
            List<Integer> selectedExamAnswerIds = submittedSelectionsByQuestion
                    .getOrDefault(examQuestion.getId(), new ArrayList<>());
            upsertAnswerSelection(examQuestion, selectedExamAnswerIds);
        }
    }

    private void upsertAnswerSelection(ExamQuestion examQuestion, List<Integer> selectedExamAnswerIds) {
        List<Integer> normalizedIds = selectedExamAnswerIds == null ? new ArrayList<>() : selectedExamAnswerIds.stream()
                .filter(id -> id != null)
                .distinct()
                .toList();

        List<ExamAnswer> selectedExamAnswers = normalizedIds.isEmpty()
                ? new ArrayList<>()
                : examAnswerRepository.findByIdIn(normalizedIds);

        if (selectedExamAnswers.size() != normalizedIds.size()) {
            throw new ResourceNotFoundException("Một hoặc nhiều đáp án được chọn không tồn tại.");
        }

        for (ExamAnswer examAnswer : selectedExamAnswers) {
            if (!examAnswer.getExamQuestion().getId().equals(examQuestion.getId())) {
                throw new BadRequestException("Đáp án " + examAnswer.getId() + " không thuộc câu hỏi "
                        + examQuestion.getId());
            }
        }

        UserAnswer userAnswer = userAnswerRepository.findByExamQuestionId(examQuestion.getId())
                .orElse(UserAnswer.builder()
                        .examQuestion(examQuestion)
                        .build());

        userAnswer.getSelectedAnswers().clear();
        for (ExamAnswer examAnswer : selectedExamAnswers) {
            userAnswer.getSelectedAnswers().add(UserAnswerSelection.builder()
                    .userAnswer(userAnswer)
                    .selectedAnswer(examAnswer.getAnswer())
                    .build());
        }

        userAnswerRepository.save(userAnswer);
    }

    private ExamSession getValidDoingSession(Integer sessionId, Integer userId) {
        ExamSession session = examSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Phiên thi không tìm thấy với id: " + sessionId));

        if (!session.getUser().getId().equals(userId)) {
            throw new BadRequestException("Phiên thi không thuộc về bạn.");
        }

        if (session.getStatus() != ExamSession.Status.DOING) {
            throw new BadRequestException("Phiên thi đã kết thúc.");
        }

        return session;
    }

    private void validateExamOngoing(Exam exam) {
        LocalDateTime now = LocalDateTime.now();
        if (exam.getStartTime() != null && now.isBefore(exam.getStartTime())) {
            throw new BadRequestException("Kỳ thi chưa bắt đầu.");
        }
        if (exam.getEndTime() != null && now.isAfter(exam.getEndTime())) {
            throw new BadRequestException("Kỳ thi đã kết thúc.");
        }
    }

    private ExamSessionResponseDTO toSessionResponseDTO(ExamSession session) {
        return ExamSessionResponseDTO.builder()
                .id(session.getId())
                .examId(session.getExam().getId())
                .examTitle(session.getExam().getTitle())
                .userId(session.getUser().getId())
                .userName(session.getUser().getName())
                .startTime(session.getStartTime())
                .endTime(session.getEndTime())
                .status(session.getStatus().name())
                .build();
    }
}

package com.gr1.exam.module.question.service;

import com.gr1.exam.core.exception.BadRequestException;
import com.gr1.exam.core.exception.ResourceNotFoundException;
import com.gr1.exam.module.question.dto.QuestionRequestDTO;
import com.gr1.exam.module.question.dto.QuestionResponseDTO;
import com.gr1.exam.module.question.entity.Answer;
import com.gr1.exam.module.question.entity.Question;
import com.gr1.exam.module.question.entity.Subject;
import com.gr1.exam.module.question.repository.AnswerRepository;
import com.gr1.exam.module.question.repository.QuestionRepository;
import com.gr1.exam.module.question.repository.SubjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final SubjectRepository subjectRepository;

    /**
     * Lấy danh sách câu hỏi — hỗ trợ filter theo subjectId, keyword + phân trang.
     */
    public Page<QuestionResponseDTO> getAllQuestions(Integer subjectId, String keyword, Pageable pageable) {
        Page<Question> page;

        if (subjectId != null && keyword != null && !keyword.isBlank()) {
            page = questionRepository.findBySubjectIdAndContentContainingIgnoreCase(subjectId, keyword, pageable);
        } else if (subjectId != null) {
            page = questionRepository.findBySubjectId(subjectId, pageable);
        } else if (keyword != null && !keyword.isBlank()) {
            page = questionRepository.findByContentContainingIgnoreCase(keyword, pageable);
        } else {
            page = questionRepository.findAll(pageable);
        }

        return page.map(this::toResponseDTO);
    }

    /**
     * Lấy chi tiết câu hỏi theo ID (kèm danh sách answers).
     */
    public QuestionResponseDTO getQuestionById(Integer id) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Câu hỏi không tìm thấy với id: " + id));
        return toResponseDTO(question);
    }

    /**
     * Tạo câu hỏi mới kèm đáp án.
     * Validate: ≥ 2 đáp án, ít nhất 1 đáp án đúng.
     */
    @Transactional
    public QuestionResponseDTO createQuestion(QuestionRequestDTO request) {
        // Validate subject
        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Môn học không tìm thấy với id: " + request.getSubjectId()));

        // Validate answers
        validateAnswers(request.getAnswers());

        // Tạo Question
        Question question = Question.builder()
                .content(request.getContent())
                .subject(subject)
                .answers(new ArrayList<>())
                .build();

        // Tạo Answers và liên kết với Question
        List<Answer> answers = request.getAnswers().stream()
                .map(dto -> Answer.builder()
                        .content(dto.getContent())
                        .isCorrect(dto.getIsCorrect() != null && dto.getIsCorrect())
                        .question(question)
                        .build())
                .collect(Collectors.toList());

        question.setAnswers(answers);

        Question saved = questionRepository.save(question);
        return toResponseDTO(saved);
    }

    /**
     * Cập nhật câu hỏi + đáp án.
     * Xoá đáp án cũ, thay bằng đáp án mới (orphanRemoval).
     */
    @Transactional
    public QuestionResponseDTO updateQuestion(Integer id, QuestionRequestDTO request) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Câu hỏi không tìm thấy với id: " + id));

        // Validate subject
        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Môn học không tìm thấy với id: " + request.getSubjectId()));

        // Validate answers
        validateAnswers(request.getAnswers());

        // Cập nhật Question
        question.setContent(request.getContent());
        question.setSubject(subject);

        // Xoá đáp án cũ, thêm đáp án mới (orphanRemoval sẽ xoá cũ)
        question.getAnswers().clear();

        List<Answer> newAnswers = request.getAnswers().stream()
                .map(dto -> Answer.builder()
                        .content(dto.getContent())
                        .isCorrect(dto.getIsCorrect() != null && dto.getIsCorrect())
                        .question(question)
                        .build())
                .collect(Collectors.toList());

        question.getAnswers().addAll(newAnswers);

        Question updated = questionRepository.save(question);
        return toResponseDTO(updated);
    }

    /**
     * Xoá câu hỏi (cascade xoá answers).
     */
    @Transactional
    public void deleteQuestion(Integer id) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Câu hỏi không tìm thấy với id: " + id));
        questionRepository.delete(question);
    }

    // ==================== Validation ====================

    /**
     * Validate danh sách đáp án:
     * - Ít nhất 2 đáp án
     * - Ít nhất 1 đáp án đúng (cho phép nhiều đáp án đúng)
     */
    private void validateAnswers(List<QuestionRequestDTO.AnswerDTO> answers) {
        if (answers == null || answers.size() < 2) {
            throw new BadRequestException("Câu hỏi phải có ít nhất 2 đáp án.");
        }

        long correctCount = answers.stream()
                .filter(a -> a.getIsCorrect() != null && a.getIsCorrect())
                .count();

        if (correctCount < 1) {
            throw new BadRequestException("Câu hỏi phải có ít nhất 1 đáp án đúng.");
        }
    }

    // ==================== Helper ====================

    private QuestionResponseDTO toResponseDTO(Question question) {
        List<QuestionResponseDTO.AnswerResponseDTO> answerDTOs = question.getAnswers() != null
                ? question.getAnswers().stream()
                    .map(a -> QuestionResponseDTO.AnswerResponseDTO.builder()
                            .id(a.getId())
                            .content(a.getContent())
                            .isCorrect(a.getIsCorrect())
                            .build())
                    .collect(Collectors.toList())
                : List.of();

        return QuestionResponseDTO.builder()
                .id(question.getId())
                .content(question.getContent())
                .subjectId(question.getSubject().getId())
                .subjectName(question.getSubject().getName())
                .createdAt(question.getCreatedAt())
                .answers(answerDTOs)
                .build();
    }
}

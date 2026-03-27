package com.gr1.exam.module.exam.service;

import com.gr1.exam.core.exception.BadRequestException;
import com.gr1.exam.core.exception.ResourceNotFoundException;
import com.gr1.exam.module.exam.dto.ExamParticipantDTO;
import com.gr1.exam.module.exam.dto.ExamRequestDTO;
import com.gr1.exam.module.exam.dto.ExamResponseDTO;
import com.gr1.exam.module.exam.entity.Exam;
import com.gr1.exam.module.exam.entity.ExamParticipant;
import com.gr1.exam.module.exam.repository.ExamParticipantRepository;
import com.gr1.exam.module.exam.repository.ExamRepository;
import com.gr1.exam.module.question.entity.Subject;
import com.gr1.exam.module.question.repository.QuestionRepository;
import com.gr1.exam.module.question.repository.SubjectRepository;
import com.gr1.exam.module.user.dto.UserResponseDTO;
import com.gr1.exam.module.user.entity.User;
import com.gr1.exam.module.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExamService {

    private final ExamRepository examRepository;
    private final ExamParticipantRepository participantRepository;
    private final SubjectRepository subjectRepository;
    private final QuestionRepository questionRepository;
    private final UserRepository userRepository;

    // ==================== CRUD Kỳ thi ====================

    /**
     * Danh sách tất cả kỳ thi.
     */
    public List<ExamResponseDTO> getAllExams() {
        return examRepository.findAll()
                .stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    /**
     * Chi tiết kỳ thi theo ID.
     */
    public ExamResponseDTO getExamById(Integer id) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Kỳ thi không tìm thấy với id: " + id));
        return toResponseDTO(exam);
    }

    /**
     * Tạo kỳ thi mới với validations:
     * - Subject tồn tại
     * - totalQuestions ≤ số câu trong ngân hàng theo subject
     * - startTime < endTime
     * - duration > 0
     */
    @Transactional
    public ExamResponseDTO createExam(ExamRequestDTO request) {
        // Validate subject
        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Môn học không tìm thấy với id: " + request.getSubjectId()));

        // Validate totalQuestions ≤ câu hỏi trong ngân hàng
        long availableQuestions = questionRepository.countBySubjectId(request.getSubjectId());
        if (request.getTotalQuestions() > availableQuestions) {
            throw new BadRequestException(
                    "Số câu hỏi yêu cầu (" + request.getTotalQuestions() + ") vượt quá ngân hàng câu hỏi (" + availableQuestions + ") của môn " + subject.getName());
        }

        // Validate thời gian
        validateTimeRange(request.getStartTime(), request.getEndTime());

        // Tạo Exam
        Exam exam = Exam.builder()
                .title(request.getTitle())
                .subject(subject)
                .duration(request.getDuration())
                .totalQuestions(request.getTotalQuestions())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .build();

        Exam saved = examRepository.save(exam);
        return toResponseDTO(saved);
    }

    /**
     * Cập nhật kỳ thi — không cho phép sửa nếu đang ONGOING hoặc COMPLETED.
     */
    @Transactional
    public ExamResponseDTO updateExam(Integer id, ExamRequestDTO request) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Kỳ thi không tìm thấy với id: " + id));

        // Kiểm tra trạng thái — chỉ cho sửa khi UPCOMING
        String status = computeStatus(exam);
        if (!"UPCOMING".equals(status)) {
            throw new BadRequestException("Không thể sửa kỳ thi đang ở trạng thái: " + status);
        }

        // Validate subject
        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Môn học không tìm thấy với id: " + request.getSubjectId()));

        // Validate totalQuestions
        long availableQuestions = questionRepository.countBySubjectId(request.getSubjectId());
        if (request.getTotalQuestions() > availableQuestions) {
            throw new BadRequestException(
                    "Số câu hỏi yêu cầu (" + request.getTotalQuestions() + ") vượt quá ngân hàng câu hỏi (" + availableQuestions + ") của môn " + subject.getName());
        }

        // Validate thời gian
        validateTimeRange(request.getStartTime(), request.getEndTime());

        // Cập nhật
        exam.setTitle(request.getTitle());
        exam.setSubject(subject);
        exam.setDuration(request.getDuration());
        exam.setTotalQuestions(request.getTotalQuestions());
        exam.setStartTime(request.getStartTime());
        exam.setEndTime(request.getEndTime());

        Exam updated = examRepository.save(exam);
        return toResponseDTO(updated);
    }

    /**
     * Xoá kỳ thi — không cho phép xoá nếu đang ONGOING hoặc COMPLETED.
     */
    @Transactional
    public void deleteExam(Integer id) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Kỳ thi không tìm thấy với id: " + id));

        String status = computeStatus(exam);
        if (!"UPCOMING".equals(status)) {
            throw new BadRequestException("Không thể xoá kỳ thi đang ở trạng thái: " + status);
        }

        examRepository.delete(exam);
    }

    // ==================== Quản lý Thí sinh ====================

    /**
     * Thêm thí sinh vào kỳ thi.
     * Validate: exam tồn tại, user tồn tại + là STUDENT, chưa được thêm.
     */
    @Transactional
    public void addParticipant(Integer examId, ExamParticipantDTO request) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Kỳ thi không tìm thấy với id: " + examId));

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User không tìm thấy với id: " + request.getUserId()));

        // Kiểm tra role STUDENT
        if (user.getRole() != User.Role.STUDENT) {
            throw new BadRequestException("Chỉ có thể thêm user có role STUDENT vào kỳ thi.");
        }

        // Kiểm tra trùng
        if (participantRepository.existsByExamIdAndUserId(examId, request.getUserId())) {
            throw new BadRequestException("User \"" + user.getName() + "\" đã được thêm vào kỳ thi này.");
        }

        ExamParticipant participant = ExamParticipant.builder()
                .exam(exam)
                .user(user)
                .build();

        participantRepository.save(participant);
    }

    /**
     * Danh sách thí sinh của kỳ thi.
     */
    public List<UserResponseDTO> getParticipants(Integer examId) {
        // Validate exam exists
        examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Kỳ thi không tìm thấy với id: " + examId));

        return participantRepository.findByExamId(examId)
                .stream()
                .map(p -> UserResponseDTO.builder()
                        .id(p.getUser().getId())
                        .name(p.getUser().getName())
                        .role(p.getUser().getRole().name())
                        .build())
                .collect(Collectors.toList());
    }

    // ==================== Helpers ====================

    /**
     * Tính trạng thái kỳ thi dựa trên thời gian hiện tại.
     */
    private String computeStatus(Exam exam) {
        LocalDateTime now = LocalDateTime.now();
        if (exam.getStartTime() == null || now.isBefore(exam.getStartTime())) {
            return "UPCOMING";
        } else if (exam.getEndTime() == null || now.isAfter(exam.getEndTime())) {
            return "COMPLETED";
        } else {
            return "ONGOING";
        }
    }

    private void validateTimeRange(LocalDateTime startTime, LocalDateTime endTime) {
        if (startTime != null && endTime != null && !startTime.isBefore(endTime)) {
            throw new BadRequestException("Thời gian bắt đầu phải trước thời gian kết thúc.");
        }
    }

    private ExamResponseDTO toResponseDTO(Exam exam) {
        long participantCount = participantRepository.countByExamId(exam.getId());

        return ExamResponseDTO.builder()
                .id(exam.getId())
                .title(exam.getTitle())
                .subjectId(exam.getSubject().getId())
                .subjectName(exam.getSubject().getName())
                .duration(exam.getDuration())
                .totalQuestions(exam.getTotalQuestions())
                .startTime(exam.getStartTime())
                .endTime(exam.getEndTime())
                .status(computeStatus(exam))
                .participantCount(participantCount)
                .build();
    }
}

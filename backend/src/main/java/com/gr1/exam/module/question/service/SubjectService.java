package com.gr1.exam.module.question.service;

import com.gr1.exam.core.exception.BadRequestException;
import com.gr1.exam.core.exception.ResourceNotFoundException;
import com.gr1.exam.module.question.dto.SubjectRequestDTO;
import com.gr1.exam.module.question.dto.SubjectResponseDTO;
import com.gr1.exam.module.question.entity.Subject;
import com.gr1.exam.module.question.repository.QuestionRepository;
import com.gr1.exam.module.question.repository.SubjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubjectService {

    private final SubjectRepository subjectRepository;
    private final QuestionRepository questionRepository;

    /**
     * Lấy danh sách tất cả môn học.
     */
    public List<SubjectResponseDTO> getAllSubjects() {
        return subjectRepository.findAll()
                .stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    /**
     * Lấy môn học theo ID.
     */
    public SubjectResponseDTO getSubjectById(Integer id) {
        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Môn học không tìm thấy với id: " + id));
        return toResponseDTO(subject);
    }

    /**
     * Tạo môn học mới.
     */
    public SubjectResponseDTO createSubject(SubjectRequestDTO request) {
        Subject subject = Subject.builder()
                .name(request.getName())
                .build();
        Subject saved = subjectRepository.save(subject);
        return toResponseDTO(saved);
    }

    /**
     * Cập nhật tên môn học.
     */
    public SubjectResponseDTO updateSubject(Integer id, SubjectRequestDTO request) {
        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Môn học không tìm thấy với id: " + id));
        subject.setName(request.getName());
        Subject updated = subjectRepository.save(subject);
        return toResponseDTO(updated);
    }

    /**
     * Xoá môn học — từ chối nếu còn câu hỏi thuộc môn này.
     */
    public void deleteSubject(Integer id) {
        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Môn học không tìm thấy với id: " + id));

        long questionCount = questionRepository.countBySubjectId(id);
        if (questionCount > 0) {
            throw new BadRequestException(
                    "Không thể xoá môn học \"" + subject.getName() + "\" vì còn " + questionCount + " câu hỏi thuộc môn này.");
        }

        subjectRepository.delete(subject);
    }

    // ==================== Helper ====================

    private SubjectResponseDTO toResponseDTO(Subject subject) {
        return SubjectResponseDTO.builder()
                .id(subject.getId())
                .name(subject.getName())
                .build();
    }
}

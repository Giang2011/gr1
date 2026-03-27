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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ExamServiceTest {

    @Mock
    private ExamRepository examRepository;

    @Mock
    private ExamParticipantRepository participantRepository;

    @Mock
    private SubjectRepository subjectRepository;

    @Mock
    private QuestionRepository questionRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ExamService examService;

    @Test
    void createExam_shouldReturnCreatedExam_whenValid() {
        ExamRequestDTO request = buildValidRequest();
        Subject subject = Subject.builder().id(1).name("Toan").build();

        when(subjectRepository.findById(1)).thenReturn(Optional.of(subject));
        when(questionRepository.countBySubjectId(1)).thenReturn(30L);
        when(examRepository.save(any(Exam.class))).thenAnswer(invocation -> {
            Exam exam = invocation.getArgument(0);
            exam.setId(10);
            return exam;
        });
        when(participantRepository.countByExamId(10)).thenReturn(0L);

        ExamResponseDTO result = examService.createExam(request);

        assertThat(result.getId()).isEqualTo(10);
        assertThat(result.getTitle()).isEqualTo("Kiem tra Toan");
        assertThat(result.getSubjectName()).isEqualTo("Toan");
        assertThat(result.getStatus()).isEqualTo("UPCOMING");
    }

    @Test
    void createExam_shouldThrowNotFound_whenSubjectMissing() {
        ExamRequestDTO request = buildValidRequest();
        request.setSubjectId(99);
        when(subjectRepository.findById(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> examService.createExam(request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Môn học không tìm thấy với id: 99");
    }

    @Test
    void createExam_shouldThrowBadRequest_whenTotalQuestionsExceedsBank() {
        ExamRequestDTO request = buildValidRequest();
        request.setTotalQuestions(50);
        Subject subject = Subject.builder().id(1).name("Toan").build();

        when(subjectRepository.findById(1)).thenReturn(Optional.of(subject));
        when(questionRepository.countBySubjectId(1)).thenReturn(20L);

        assertThatThrownBy(() -> examService.createExam(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("vượt quá ngân hàng câu hỏi");
    }

    @Test
    void createExam_shouldThrowBadRequest_whenInvalidTimeRange() {
        ExamRequestDTO request = buildValidRequest();
        request.setStartTime(LocalDateTime.now().plusDays(1));
        request.setEndTime(LocalDateTime.now());

        Subject subject = Subject.builder().id(1).name("Toan").build();
        when(subjectRepository.findById(1)).thenReturn(Optional.of(subject));
        when(questionRepository.countBySubjectId(1)).thenReturn(30L);

        assertThatThrownBy(() -> examService.createExam(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Thời gian bắt đầu phải trước thời gian kết thúc");
    }

    @Test
    void updateExam_shouldThrowBadRequest_whenExamNotUpcoming() {
        ExamRequestDTO request = buildValidRequest();
        Subject subject = Subject.builder().id(1).name("Toan").build();

        Exam existing = Exam.builder()
                .id(5)
                .title("Exam")
                .subject(subject)
                .duration(45)
                .totalQuestions(20)
                .startTime(LocalDateTime.now().minusMinutes(10))
                .endTime(LocalDateTime.now().plusMinutes(10))
                .build();

        when(examRepository.findById(5)).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> examService.updateExam(5, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Không thể sửa kỳ thi đang ở trạng thái: ONGOING");
    }

    @Test
    void deleteExam_shouldThrowBadRequest_whenExamCompleted() {
        Subject subject = Subject.builder().id(1).name("Toan").build();
        Exam existing = Exam.builder()
                .id(6)
                .title("Exam")
                .subject(subject)
                .duration(45)
                .totalQuestions(20)
                .startTime(LocalDateTime.now().minusDays(2))
                .endTime(LocalDateTime.now().minusDays(1))
                .build();

        when(examRepository.findById(6)).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> examService.deleteExam(6))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Không thể xoá kỳ thi đang ở trạng thái: COMPLETED");
    }

    @Test
    void addParticipant_shouldThrowBadRequest_whenUserNotStudent() {
        Subject subject = Subject.builder().id(1).name("Toan").build();
        Exam exam = Exam.builder().id(7).title("Exam").subject(subject).build();
        User user = User.builder().id(2).name("admin").role(User.Role.ADMIN).build();

        ExamParticipantDTO request = new ExamParticipantDTO();
        request.setUserId(2);

        when(examRepository.findById(7)).thenReturn(Optional.of(exam));
        when(userRepository.findById(2)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> examService.addParticipant(7, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Chỉ có thể thêm user có role STUDENT");

        verify(participantRepository, never()).save(any(ExamParticipant.class));
    }

    @Test
    void addParticipant_shouldThrowBadRequest_whenDuplicateParticipant() {
        Subject subject = Subject.builder().id(1).name("Toan").build();
        Exam exam = Exam.builder().id(8).title("Exam").subject(subject).build();
        User user = User.builder().id(3).name("student").role(User.Role.STUDENT).build();

        ExamParticipantDTO request = new ExamParticipantDTO();
        request.setUserId(3);

        when(examRepository.findById(8)).thenReturn(Optional.of(exam));
        when(userRepository.findById(3)).thenReturn(Optional.of(user));
        when(participantRepository.existsByExamIdAndUserId(8, 3)).thenReturn(true);

        assertThatThrownBy(() -> examService.addParticipant(8, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("đã được thêm vào kỳ thi này");
    }

    @Test
    void getParticipants_shouldReturnMappedUsers_whenExamExists() {
        Subject subject = Subject.builder().id(1).name("Toan").build();
        Exam exam = Exam.builder().id(9).title("Exam").subject(subject).build();
        User user = User.builder().id(4).name("student-a").role(User.Role.STUDENT).build();
        ExamParticipant participant = ExamParticipant.builder().id(1).exam(exam).user(user).build();

        when(examRepository.findById(9)).thenReturn(Optional.of(exam));
        when(participantRepository.findByExamId(9)).thenReturn(List.of(participant));

        List<UserResponseDTO> result = examService.getParticipants(9);

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().getName()).isEqualTo("student-a");
        assertThat(result.getFirst().getRole()).isEqualTo("STUDENT");
    }

    private ExamRequestDTO buildValidRequest() {
        ExamRequestDTO request = new ExamRequestDTO();
        request.setTitle("Kiem tra Toan");
        request.setSubjectId(1);
        request.setDuration(45);
        request.setTotalQuestions(20);
        request.setStartTime(LocalDateTime.now().plusDays(1));
        request.setEndTime(LocalDateTime.now().plusDays(1).plusHours(2));
        return request;
    }
}

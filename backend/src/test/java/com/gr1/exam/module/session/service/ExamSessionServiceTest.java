package com.gr1.exam.module.session.service;

import com.gr1.exam.core.exception.BadRequestException;
import com.gr1.exam.core.exception.ResourceNotFoundException;
import com.gr1.exam.module.exam.entity.Exam;
import com.gr1.exam.module.exam.repository.ExamParticipantRepository;
import com.gr1.exam.module.exam.repository.ExamRepository;
import com.gr1.exam.module.grading.service.GradingService;
import com.gr1.exam.module.question.entity.Answer;
import com.gr1.exam.module.question.entity.Question;
import com.gr1.exam.module.question.entity.Subject;
import com.gr1.exam.module.question.repository.AnswerRepository;
import com.gr1.exam.module.question.repository.QuestionRepository;
import com.gr1.exam.module.session.dto.ExamSessionResponseDTO;
import com.gr1.exam.module.session.dto.QuestionAnswerSubmissionDTO;
import com.gr1.exam.module.session.dto.SubmitSessionRequestDTO;
import com.gr1.exam.module.session.dto.UserAnswerRequestDTO;
import com.gr1.exam.module.session.entity.ExamAnswer;
import com.gr1.exam.module.session.entity.ExamQuestion;
import com.gr1.exam.module.session.entity.ExamSession;
import com.gr1.exam.module.session.entity.UserAnswer;
import com.gr1.exam.module.session.repository.ExamAnswerRepository;
import com.gr1.exam.module.session.repository.ExamQuestionRepository;
import com.gr1.exam.module.session.repository.ExamSessionRepository;
import com.gr1.exam.module.session.repository.UserAnswerRepository;
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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExamSessionServiceTest {

    @Mock
    private ExamSessionRepository examSessionRepository;
    @Mock
    private ExamQuestionRepository examQuestionRepository;
    @Mock
    private ExamAnswerRepository examAnswerRepository;
    @Mock
    private UserAnswerRepository userAnswerRepository;
    @Mock
    private QuestionRepository questionRepository;
    @Mock
    private AnswerRepository answerRepository;
    @Mock
    private ExamRepository examRepository;
    @Mock
    private ExamParticipantRepository examParticipantRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private GradingService gradingService;

    @InjectMocks
    private ExamSessionService examSessionService;

    @Test
    void saveAnswer_shouldInsertCompatibilityModeSelection() {
        ExamSession session = buildDoingSession();
        Subject subject = Subject.builder().id(1).name("Toan").build();
        Question q1 = buildQuestion(1, "Q", subject);
        Answer a1 = buildAnswer(1, q1, "A", true);

        ExamQuestion eq = ExamQuestion.builder().id(10).examSession(session).question(q1).orderIndex(1).build();
        ExamAnswer ea = ExamAnswer.builder().id(100).examQuestion(eq).answer(a1).orderIndex(0).build();

        when(examSessionRepository.findById(1)).thenReturn(Optional.of(session));
        when(examQuestionRepository.findById(10)).thenReturn(Optional.of(eq));
        when(examAnswerRepository.findByIdIn(List.of(100))).thenReturn(List.of(ea));
        when(userAnswerRepository.findByExamQuestionId(10)).thenReturn(Optional.empty());

        UserAnswerRequestDTO dto = new UserAnswerRequestDTO();
        dto.setExamQuestionId(10);
        dto.setSelectedExamAnswerId(100);

        examSessionService.saveAnswer(1, 10, dto);

        verify(userAnswerRepository).save(any(UserAnswer.class));
    }

    @Test
    void submitSession_shouldSaveBatchAnswersAndTriggerGrading() {
        ExamSession session = buildDoingSession();
        Subject subject = Subject.builder().id(1).name("Toan").build();
        Question q1 = buildQuestion(1, "Q1", subject);
        Answer a1 = buildAnswer(1, q1, "A", true);

        ExamQuestion eq = ExamQuestion.builder().id(10).examSession(session).question(q1).orderIndex(1).build();
        ExamAnswer ea = ExamAnswer.builder().id(100).examQuestion(eq).answer(a1).orderIndex(0).build();

        when(examSessionRepository.findByIdAndUserIdForUpdate(1, 10)).thenReturn(Optional.of(session));
        when(examQuestionRepository.findByExamSessionIdOrderByOrderIndex(1)).thenReturn(List.of(eq));
        when(examAnswerRepository.findByIdIn(List.of(100))).thenReturn(List.of(ea));
        when(userAnswerRepository.findByExamQuestionId(10)).thenReturn(Optional.empty());
        when(examSessionRepository.save(any(ExamSession.class))).thenAnswer(inv -> inv.getArgument(0));

        QuestionAnswerSubmissionDTO answerSubmission = new QuestionAnswerSubmissionDTO();
        answerSubmission.setExamQuestionId(10);
        answerSubmission.setSelectedExamAnswerIds(List.of(100));

        SubmitSessionRequestDTO request = new SubmitSessionRequestDTO();
        request.setAnswers(List.of(answerSubmission));

        ExamSessionResponseDTO result = examSessionService.submitSession(1, 10, request);

        assertThat(result.getStatus()).isEqualTo("SUBMITTED");
        verify(gradingService).grade(1);
        verify(userAnswerRepository).save(any(UserAnswer.class));
    }

    @Test
    void submitSession_shouldRejectWhenAlreadySubmitted() {
        Subject subject = Subject.builder().id(1).name("Toan").build();
        Exam exam = buildOngoingExam(subject, 5);
        User user = buildStudent();

        ExamSession submittedSession = ExamSession.builder()
                .id(1)
                .exam(exam)
                .user(user)
                .status(ExamSession.Status.SUBMITTED)
                .startTime(LocalDateTime.now().minusMinutes(30))
                .endTime(LocalDateTime.now())
                .build();

        when(examSessionRepository.findByIdAndUserIdForUpdate(1, 10)).thenReturn(Optional.of(submittedSession));

        SubmitSessionRequestDTO request = new SubmitSessionRequestDTO();
        request.setAnswers(List.of());

        assertThatThrownBy(() -> examSessionService.submitSession(1, 10, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("đã được nộp trước đó");
    }

    @Test
    void submitSession_shouldThrowWhenSessionMissing() {
        when(examSessionRepository.findByIdAndUserIdForUpdate(99, 10)).thenReturn(Optional.empty());

        SubmitSessionRequestDTO request = new SubmitSessionRequestDTO();
        request.setAnswers(List.of());

        assertThatThrownBy(() -> examSessionService.submitSession(99, 10, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Phiên thi không tìm thấy");
    }

    private User buildStudent() {
        return User.builder().id(10).name("student1").role(User.Role.STUDENT).password("pass").build();
    }

    private Exam buildOngoingExam(Subject subject, int totalQuestions) {
        return Exam.builder()
                .id(1).title("Kiem tra").subject(subject).duration(45).totalQuestions(totalQuestions)
                .startTime(LocalDateTime.now().minusHours(1))
                .endTime(LocalDateTime.now().plusHours(1))
                .build();
    }

    private ExamSession buildDoingSession() {
        Subject subject = Subject.builder().id(1).name("Toan").build();
        Exam exam = buildOngoingExam(subject, 5);
        User user = buildStudent();
        return ExamSession.builder()
                .id(1).exam(exam).user(user)
                .status(ExamSession.Status.DOING)
                .startTime(LocalDateTime.now().minusMinutes(10))
                .build();
    }

    private Question buildQuestion(int id, String content, Subject subject) {
        return Question.builder().id(id).content(content).subject(subject).build();
    }

    private Answer buildAnswer(int id, Question question, String content, boolean correct) {
        return Answer.builder().id(id).question(question).content(content).isCorrect(correct).build();
    }
}

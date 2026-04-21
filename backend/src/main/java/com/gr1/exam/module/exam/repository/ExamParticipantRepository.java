package com.gr1.exam.module.exam.repository;

import com.gr1.exam.module.exam.entity.ExamParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExamParticipantRepository extends JpaRepository<ExamParticipant, Integer> {
    List<ExamParticipant> findByExamId(Integer examId);
    List<ExamParticipant> findByUserId(Integer userId);
    boolean existsByExamIdAndUserId(Integer examId, Integer userId);
    long countByExamId(Integer examId);
    Optional<ExamParticipant> findByExamIdAndUserId(Integer examId, Integer userId);
}

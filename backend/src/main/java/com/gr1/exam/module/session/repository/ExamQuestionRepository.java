package com.gr1.exam.module.session.repository;

import com.gr1.exam.module.session.entity.ExamQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamQuestionRepository extends JpaRepository<ExamQuestion, Integer> {
    List<ExamQuestion> findByExamSessionIdOrderByOrderIndex(Integer examSessionId);
}

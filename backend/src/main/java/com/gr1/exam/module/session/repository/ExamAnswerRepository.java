package com.gr1.exam.module.session.repository;

import com.gr1.exam.module.session.entity.ExamAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamAnswerRepository extends JpaRepository<ExamAnswer, Integer> {
    List<ExamAnswer> findByExamQuestionIdOrderByOrderIndex(Integer examQuestionId);

    List<ExamAnswer> findByIdIn(List<Integer> ids);
}

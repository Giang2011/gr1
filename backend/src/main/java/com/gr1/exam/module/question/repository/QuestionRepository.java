package com.gr1.exam.module.question.repository;

import com.gr1.exam.module.question.entity.Question;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Integer> {

    List<Question> findBySubjectId(Integer subjectId);

    long countBySubjectId(Integer subjectId);

    // Pagination + filtering
    Page<Question> findBySubjectId(Integer subjectId, Pageable pageable);

    Page<Question> findByContentContainingIgnoreCase(String keyword, Pageable pageable);

    Page<Question> findBySubjectIdAndContentContainingIgnoreCase(Integer subjectId, String keyword, Pageable pageable);
}

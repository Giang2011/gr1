package com.gr1.exam.module.question.repository;

import com.gr1.exam.module.question.entity.Chapter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChapterRepository extends JpaRepository<Chapter, Integer> {
    List<Chapter> findBySubjectIdOrderByChapterOrder(Integer subjectId);
    long countBySubjectId(Integer subjectId);
    boolean existsBySubjectIdAndChapterOrder(Integer subjectId, Integer chapterOrder);
}

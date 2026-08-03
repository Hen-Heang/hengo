package com.heang.koriaibackend.domain.note.mapper;

import com.heang.koriaibackend.domain.note.model.Note;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

@Mapper
public interface NoteMapper {

    @Insert("""
            INSERT INTO notes (user_id, slug, title, description, icon, category, tags, content)
            VALUES (#{userId}, #{slug}, #{title}, #{description}, #{icon}, #{category},
                    CAST(#{tags} AS jsonb), #{content})
            """)
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insertNote(Note note);

    @Update("""
            UPDATE notes SET
                title = #{title}, description = #{description}, icon = #{icon}, category = #{category},
                tags = CAST(#{tags} AS jsonb), content = #{content}, updated_at = NOW()
            WHERE user_id = #{userId} AND slug = #{slug}
            """)
    int updateNote(Note note);

    @Delete("DELETE FROM notes WHERE user_id = #{userId} AND slug = #{slug}")
    int deleteByUserAndSlug(@Param("userId") Long userId, @Param("slug") String slug);

    @Select("""
            SELECT id, user_id, slug, title, description, icon, category,
                   tags::text AS tags, content, created_at, updated_at
            FROM notes WHERE user_id = #{userId} AND slug = #{slug}
            """)
    Note findByUserAndSlug(@Param("userId") Long userId, @Param("slug") String slug);

    // Metadata only (no content) for the library/index page.
    @Select("""
            SELECT id, user_id, slug, title, description, icon, category,
                   tags::text AS tags, created_at, updated_at
            FROM notes WHERE user_id = #{userId} ORDER BY updated_at DESC
            """)
    List<Note> findMetaByUserId(@Param("userId") Long userId);
}

package com.heang.koriaibackend.domain.chat.mapper;

import com.heang.koriaibackend.domain.chat.model.Conversation;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Optional;

@Mapper
public interface ConversationMapper {

    int insert(Conversation conversation);

    Optional<Conversation> findById(@Param("id") Long id);

    List<Conversation> findByUserId(@Param("userId") Long userId,
                                    @Param("limit") int limit,
                                    @Param("offset") int offset);

    int updateTitle(@Param("id") Long id, @Param("title") String title);

    int incrementMessageCount(@Param("id") Long id);

    int deleteById(@Param("id") Long id);
}

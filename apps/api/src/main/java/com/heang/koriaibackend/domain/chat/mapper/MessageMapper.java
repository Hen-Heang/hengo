package com.heang.koriaibackend.domain.chat.mapper;

import com.heang.koriaibackend.domain.chat.model.Message;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Optional;

@Mapper
public interface MessageMapper {

    int insert(Message message);

    Optional<Message> findById(@Param("id") Long id);

    List<Message> findByConversationId(@Param("conversationId") Long conversationId,
                                       @Param("limit") int limit,
                                       @Param("offset") int offset);

    List<Message> findRecentByConversationId(@Param("conversationId") Long conversationId,
                                             @Param("limit") int limit);

    int deleteByConversationId(@Param("conversationId") Long conversationId);
}

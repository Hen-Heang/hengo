package com.heang.koriaibackend.common.exception;

import com.heang.koriaibackend.common.api.Code;
import lombok.Getter;

@Getter
public class BusinessException extends RuntimeException {

    private final Code code;

    public BusinessException(Code code) {
        super(code.getMessage());
        this.code = code;
    }

    public BusinessException(Code code, String message) {
        super(message);
        this.code = code;
    }
}

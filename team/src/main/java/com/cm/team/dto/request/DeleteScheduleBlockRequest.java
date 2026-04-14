package com.cm.team.dto.request;

import lombok.Getter;

@Getter
public class DeleteScheduleBlockRequest {

    private DeleteScope scope;

    public enum DeleteScope {
        THIS_ONLY,       // 이 항목만
        THIS_AND_AFTER,  // 이후 모두
        ALL              // 전체
    }
}

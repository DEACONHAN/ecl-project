package com.bank.ecl.parameter.copy.publish;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.bank.ecl.common.constant.SchemeStatus;
import com.bank.ecl.data.entity.EclSchemeEntity;
import com.bank.ecl.data.mapper.EclSchemeMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class SchemePublishJob {

    private final EclSchemeMapper schemeMapper;

    @Scheduled(cron = "0 0 1 * * ?")
    @Transactional(rollbackFor = Exception.class)
    public void autoEffective() {
        log.info("SchemePublishJob.autoEffective 开始执行");

        // 1. 查询所有 PUBLISHED 且 effective_date <= 今天的方案
        List<EclSchemeEntity> pendingList = schemeMapper.selectList(
                new LambdaQueryWrapper<EclSchemeEntity>()
                        .eq(EclSchemeEntity::getStatus, SchemeStatus.PUBLISHED.name())
                        .le(EclSchemeEntity::getEffectiveDate, LocalDate.now())
        );

        if (pendingList.isEmpty()) {
            log.info("无待生效的方案");
            return;
        }

        // 2. 先查询旧 EFFECTIVE 方案（每个循环只处理一次）
        EclSchemeEntity oldEffective = schemeMapper.selectEffective();

        for (EclSchemeEntity entity : pendingList) {
            // 3. 若存在旧 EFFECTIVE 方案（且非当前待生效方案），将其到期
            if (oldEffective != null && !oldEffective.getSchemeId().equals(entity.getSchemeId())) {
                oldEffective.setStatus(SchemeStatus.EXPIRED.name());
                oldEffective.setExpiredAt(LocalDateTime.now());
                schemeMapper.updateById(oldEffective);
                log.info("旧方案 {} 已失效", oldEffective.getSchemeCode());
                oldEffective = null; // 防止重复到期
            }

            // 4. 新方案设为 EFFECTIVE，记录 effective_at=NOW()
            entity.setStatus(SchemeStatus.EFFECTIVE.name());
            entity.setEffectiveAt(LocalDateTime.now());
            entity.setUpdatedAt(LocalDateTime.now());
            schemeMapper.updateById(entity);
            log.info("方案 {} 已生效", entity.getSchemeCode());
        }

        log.info("SchemePublishJob.autoEffective 执行完毕");
    }
}

package com.bank.ecl.parameter.copy.publish;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.bank.ecl.common.constant.SchemeStatus;
import com.bank.ecl.common.exception.EclException;
import com.bank.ecl.common.exception.ErrorCode;
import com.bank.ecl.data.entity.EclSchemeEntity;
import com.bank.ecl.data.mapper.EclSchemeMapper;
import com.bank.ecl.parameter.scheme.dto.SchemePublishReq;
import com.bank.ecl.parameter.scheme.dto.SchemeVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class SchemePublishService {

    private final EclSchemeMapper schemeMapper;

    @Transactional(rollbackFor = Exception.class)
    public SchemeVO publish(String schemeId, SchemePublishReq req) {
        // 1. 查方案，校验 status=DRAFT 才能发布
        EclSchemeEntity entity = schemeMapper.selectById(schemeId);
        if (entity == null) {
            throw new EclException(ErrorCode.ECL_004, "方案不存在: " + schemeId);
        }
        if (!"DRAFT".equals(entity.getStatus())) {
            throw new EclException(ErrorCode.ECL_004, "仅 DRAFT 状态的方案可发布，当前状态: " + entity.getStatus());
        }

        // 2. 状态转换校验
        SchemeStatus currentStatus = SchemeStatus.valueOf(entity.getStatus());
        if (!currentStatus.canTransitionTo(SchemeStatus.PUBLISHED)) {
            throw new EclException(ErrorCode.ECL_004, "DRAFT 无法转换至 PUBLISHED");
        }

        if (req.isImmediate()) {
            // 3. 立即生效
            // a. 查找当前 EFFECTIVE 方案 → 设为 EXPIRED，记录 expired_at
            EclSchemeEntity effective = schemeMapper.selectEffective();
            if (effective != null && !effective.getSchemeId().equals(schemeId)) {
                effective.setStatus(SchemeStatus.EXPIRED.name());
                effective.setExpiredAt(LocalDateTime.now());
                schemeMapper.updateById(effective);
            }
            // b. 新方案设为 EFFECTIVE，记录 effective_at
            entity.setStatus(SchemeStatus.EFFECTIVE.name());
            entity.setEffectiveDate(LocalDate.now());
            entity.setEffectiveAt(LocalDateTime.now());
        } else {
            // 4. 计划生效
            // a. 校验 effectiveDate 不为空且 >= 今天
            if (req.getEffectiveDate() == null) {
                throw new EclException(ErrorCode.ECL_004, "计划生效时 effectiveDate 不能为空");
            }
            if (req.getEffectiveDate().isBefore(LocalDate.now())) {
                throw new EclException(ErrorCode.ECL_004, "计划生效日期不能早于今天");
            }
            // b. 设为 PUBLISHED，设置 effective_date
            entity.setStatus(SchemeStatus.PUBLISHED.name());
            entity.setEffectiveDate(req.getEffectiveDate());
        }

        // 5. 保存
        entity.setUpdatedAt(LocalDateTime.now());
        schemeMapper.updateById(entity);

        return toVO(entity);
    }

    private SchemeVO toVO(EclSchemeEntity entity) {
        if (entity == null) return null;
        SchemeVO vo = new SchemeVO();
        vo.setSchemeId(entity.getSchemeId());
        vo.setSchemeCode(entity.getSchemeCode());
        vo.setSchemeName(entity.getSchemeName());
        vo.setSchemeVersion(entity.getSchemeVersion());
        vo.setStatus(entity.getStatus());
        vo.setStatusDisplay(SchemeStatus.valueOf(entity.getStatus()).getDisplayName());
        vo.setEffectiveDate(entity.getEffectiveDate());
        vo.setEffectiveAt(entity.getEffectiveAt());
        vo.setExpiredAt(entity.getExpiredAt());
        vo.setDiscountRate(entity.getDiscountRate());
        vo.setDefaultCcf(entity.getDefaultCcf());
        vo.setDefaultLgd(entity.getDefaultLgd());
        vo.setCreatedBy(entity.getCreatedBy());
        vo.setCreatedAt(entity.getCreatedAt());
        vo.setUpdatedBy(entity.getUpdatedBy());
        vo.setUpdatedAt(entity.getUpdatedAt());
        vo.setDescription(entity.getDescription());
        return vo;
    }
}

package com.bank.ecl.parameter.overlay;

import com.bank.ecl.common.constant.SchemeStatus;
import com.bank.ecl.data.entity.EclSchemeEntity;
import com.bank.ecl.data.entity.OverlayRuleEntity;
import com.bank.ecl.data.mapper.EclSchemeMapper;
import com.bank.ecl.data.mapper.OverlayRuleMapper;
import com.bank.ecl.parameter.overlay.dto.OverlayMatchTestReq;
import com.bank.ecl.parameter.overlay.dto.OverlayMatchTestResp;
import com.bank.ecl.parameter.overlay.dto.OverlayRuleCreateReq;
import com.bank.ecl.parameter.overlay.dto.OverlayRuleVO;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OverlayServiceImplTest {

    @Mock private OverlayRuleMapper overlayRuleMapper;
    @Mock private EclSchemeMapper eclSchemeMapper;
    @Spy private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private OverlayServiceImpl overlayService;

    @Captor private ArgumentCaptor<OverlayRuleEntity> ruleCaptor;

    @Test
    void createRule_WithFrontendOptionalFields_ShouldPersistDefaultsAndReturnOverlayIdAlias() {
        when(eclSchemeMapper.selectById("scheme-1")).thenReturn(draftScheme());
        when(overlayRuleMapper.insert(any(OverlayRuleEntity.class))).thenAnswer(invocation -> {
            OverlayRuleEntity entity = invocation.getArgument(0);
            entity.setRuleId(100L);
            return 1;
        });

        OverlayRuleCreateReq req = new OverlayRuleCreateReq();
        req.setSchemeId("scheme-1");
        req.setGroupId("group-1");
        req.setOverlayType("PD");
        req.setAdjustmentType("PERCENTAGE");
        req.setAdjustmentValue(new BigDecimal("0.05"));
        req.setPriority(1);

        OverlayRuleVO result = overlayService.createRule(req);

        verify(overlayRuleMapper).insert(ruleCaptor.capture());
        OverlayRuleEntity inserted = ruleCaptor.getValue();
        assertEquals("{}", inserted.getConditions());
        assertNotNull(inserted.getEffectiveDate());
        assertEquals(100L, result.getRuleId());
        assertEquals(100L, result.getOverlayId());
        assertEquals("{}", result.getConditions());
    }

    @Test
    void listRules_WithoutGroupId_ShouldReturnAllSchemeRulesAndNormalizeJsonColumn() {
        OverlayRuleEntity entity = ruleEntity(100L, "group-1", "{\"industryCode\":\"J\"}");
        entity.setConditions("\"{\\\"industryCode\\\":\\\"J\\\"}\"");
        when(overlayRuleMapper.selectList(any())).thenReturn(List.of(entity));

        List<OverlayRuleVO> result = overlayService.listRules("scheme-1", null);

        assertEquals(1, result.size());
        assertEquals(100L, result.get(0).getOverlayId());
        assertEquals("{\"industryCode\":\"J\"}", result.get(0).getConditions());
    }

    @Test
    void testMatch_WithMatchingFields_ShouldSelectHighestEffectiveRule() {
        OverlayRuleEntity low = ruleEntity(100L, "group-1", "{\"industryCode\":\"J\"}");
        low.setAdjustmentValue(new BigDecimal("0.05"));
        OverlayRuleEntity high = ruleEntity(101L, "group-1", "\"{\\\"overdueDays_ge\\\":90}\"");
        high.setAdjustmentValue(new BigDecimal("0.20"));
        when(overlayRuleMapper.selectList(any())).thenReturn(List.of(low, high));

        OverlayMatchTestReq req = new OverlayMatchTestReq();
        req.setSchemeId("scheme-1");
        req.setGroupId("group-1");
        req.setFieldValues(Map.of("industryCode", "J", "overdueDays", 120));

        OverlayMatchTestResp result = overlayService.testMatch(req);

        assertTrue(result.isHasMatch());
        assertEquals(2, result.getMatchedRules().size());
        assertEquals(101L, result.getSelectedRule().getOverlayId());
        assertEquals(0.20, result.getEffectiveRatio());
    }

    @Test
    void updateRule_WithNullExpiryDate_ShouldAllowClearingExpiryDate() {
        when(overlayRuleMapper.selectById(100L)).thenReturn(ruleEntity(100L, "group-1", "{}"));
        when(eclSchemeMapper.selectById("scheme-1")).thenReturn(draftScheme());

        OverlayRuleCreateReq req = new OverlayRuleCreateReq();
        req.setSchemeId("scheme-1");
        req.setGroupId("group-1");
        req.setOverlayType("LGD");
        req.setAdjustmentType("ADDBP");
        req.setAdjustmentValue(new BigDecimal("50"));
        req.setPriority(2);
        req.setConditions("");
        req.setEffectiveDate(LocalDate.of(2026, 6, 21));
        req.setExpiryDate(null);

        OverlayRuleVO result = overlayService.updateRule(100L, req);

        verify(overlayRuleMapper).updateById(ruleCaptor.capture());
        assertNull(ruleCaptor.getValue().getExpiryDate());
        assertEquals("{}", result.getConditions());
    }

    private OverlayRuleEntity ruleEntity(Long ruleId, String groupId, String conditions) {
        OverlayRuleEntity entity = new OverlayRuleEntity();
        entity.setRuleId(ruleId);
        entity.setSchemeId("scheme-1");
        entity.setGroupId(groupId);
        entity.setOverlayType("PD");
        entity.setAdjustmentTarget("ECL_FINAL");
        entity.setAdjustmentType("PERCENTAGE");
        entity.setAdjustmentValue(new BigDecimal("0.10"));
        entity.setPriority(1);
        entity.setConditions(conditions);
        entity.setEffectiveDate(LocalDate.of(2026, 6, 21));
        entity.setExpiryDate(LocalDate.of(2026, 12, 31));
        return entity;
    }

    private EclSchemeEntity draftScheme() {
        EclSchemeEntity scheme = new EclSchemeEntity();
        scheme.setSchemeId("scheme-1");
        scheme.setStatus(SchemeStatus.DRAFT.name());
        return scheme;
    }
}

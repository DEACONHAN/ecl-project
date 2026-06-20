package com.bank.ecl.parameter.copy.publish;

import com.bank.ecl.common.constant.SchemeStatus;
import com.bank.ecl.common.exception.EclException;
import com.bank.ecl.common.util.UuidGenerator;
import com.bank.ecl.data.entity.EclSchemeEntity;
import com.bank.ecl.data.mapper.EclSchemeMapper;
import com.bank.ecl.parameter.scheme.dto.SchemePublishReq;
import com.bank.ecl.parameter.scheme.dto.SchemeVO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SchemePublishServiceTest {

    @Mock
    private EclSchemeMapper schemeMapper;

    @InjectMocks
    private SchemePublishService publishService;

    @Captor
    private ArgumentCaptor<EclSchemeEntity> entityCaptor;

    private EclSchemeEntity createTestEntity(String code, String status) {
        EclSchemeEntity entity = new EclSchemeEntity();
        entity.setSchemeId(UuidGenerator.uuid());
        entity.setSchemeCode(code);
        entity.setSchemeName("测试方案");
        entity.setSchemeVersion("v1.0");
        entity.setStatus(status);
        entity.setDiscountRate(new BigDecimal("0.0500"));
        entity.setDefaultCcf(BigDecimal.ZERO);
        entity.setDefaultLgd(new BigDecimal("0.4500"));
        entity.setCreatedBy("admin");
        entity.setCreatedAt(LocalDateTime.now());
        return entity;
    }

    // ==================== Immediate publish ====================

    @Test
    void publish_Immediate_ShouldSetEffectiveAndExpireOld() {
        // Arrange
        EclSchemeEntity draft = createTestEntity("SCH_002", "DRAFT");
        EclSchemeEntity oldEffective = createTestEntity("SCH_001", "EFFECTIVE");

        when(schemeMapper.selectById("SCH_002")).thenReturn(draft);
        when(schemeMapper.selectEffective()).thenReturn(oldEffective);

        SchemePublishReq req = new SchemePublishReq();
        req.setImmediate(true);

        // Act
        SchemeVO result = publishService.publish("SCH_002", req);

        // Assert
        assertEquals("EFFECTIVE", result.getStatus());
        assertNotNull(result.getEffectiveDate());
        assertNotNull(result.getEffectiveAt());

        // Verify two updates happened
        verify(schemeMapper, times(2)).updateById(entityCaptor.capture());
        var allUpdates = entityCaptor.getAllValues();
        boolean foundExpired = allUpdates.stream().anyMatch(e -> "EXPIRED".equals(e.getStatus()));
        assertTrue(foundExpired, "旧方案应被设为 EXPIRED");
        boolean foundEffective = allUpdates.stream().anyMatch(e -> "EFFECTIVE".equals(e.getStatus()));
        assertTrue(foundEffective, "新方案应被设为 EFFECTIVE");
    }

    @Test
    void publish_Immediate_NoExistingEffective_ShouldJustActivate() {
        // Arrange
        EclSchemeEntity draft = createTestEntity("SCH_001", "DRAFT");
        when(schemeMapper.selectById("SCH_001")).thenReturn(draft);
        when(schemeMapper.selectEffective()).thenReturn(null);

        SchemePublishReq req = new SchemePublishReq();
        req.setImmediate(true);

        // Act
        SchemeVO result = publishService.publish("SCH_001", req);

        // Assert
        assertEquals("EFFECTIVE", result.getStatus());
        verify(schemeMapper, times(1)).updateById(any(EclSchemeEntity.class));
    }

    @Test
    void publish_Immediate_SameSchemeAlreadyEffective_ShouldNotExpireItself() {
        // Arrange
        String sameSchemeId = "SCH_001";
        EclSchemeEntity draft = createTestEntity("SCH_001", "DRAFT");
        draft.setSchemeId(sameSchemeId);
        // The current effective has the same schemeId
        EclSchemeEntity sameEffective = new EclSchemeEntity();
        sameEffective.setSchemeId(sameSchemeId);
        sameEffective.setStatus("EFFECTIVE");

        when(schemeMapper.selectById(sameSchemeId)).thenReturn(draft);
        when(schemeMapper.selectEffective()).thenReturn(sameEffective);

        SchemePublishReq req = new SchemePublishReq();
        req.setImmediate(true);

        // Act
        SchemeVO result = publishService.publish(sameSchemeId, req);

        // Assert
        assertEquals("EFFECTIVE", result.getStatus());
        verify(schemeMapper, times(1)).updateById(any(EclSchemeEntity.class));
    }

    // ==================== Scheduled publish ====================

    @Test
    void publish_WhenDraftToPublished_ShouldTransitionCorrectly() {
        // Arrange
        EclSchemeEntity draft = createTestEntity("SCH_002", "DRAFT");
        when(schemeMapper.selectById("SCH_002")).thenReturn(draft);

        SchemePublishReq req = new SchemePublishReq();
        req.setImmediate(false);
        req.setEffectiveDate(LocalDate.now().plusDays(7));

        // Act
        SchemeVO result = publishService.publish("SCH_002", req);

        // Assert
        assertEquals("PUBLISHED", result.getStatus());
        assertNotNull(result.getEffectiveDate());
        assertEquals(LocalDate.now().plusDays(7), result.getEffectiveDate());
        verify(schemeMapper).updateById(entityCaptor.capture());
        assertEquals("PUBLISHED", entityCaptor.getValue().getStatus());
    }

    @Test
    void publish_Scheduled_WithNullEffectiveDate_ShouldThrow() {
        EclSchemeEntity draft = createTestEntity("SCH_001", "DRAFT");
        when(schemeMapper.selectById("SCH_001")).thenReturn(draft);

        SchemePublishReq req = new SchemePublishReq();
        req.setImmediate(false);
        req.setEffectiveDate(null);

        assertThrows(EclException.class, () -> publishService.publish("SCH_001", req));
    }

    @Test
    void publish_Scheduled_WithPastEffectiveDate_ShouldThrow() {
        EclSchemeEntity draft = createTestEntity("SCH_001", "DRAFT");
        when(schemeMapper.selectById("SCH_001")).thenReturn(draft);

        SchemePublishReq req = new SchemePublishReq();
        req.setImmediate(false);
        req.setEffectiveDate(LocalDate.now().minusDays(1));

        assertThrows(EclException.class, () -> publishService.publish("SCH_001", req));
    }

    // ==================== Validation ====================

    @Test
    void publish_WhenNotDraft_ShouldThrow() {
        EclSchemeEntity effective = createTestEntity("SCH_001", "EFFECTIVE");
        when(schemeMapper.selectById("SCH_001")).thenReturn(effective);

        SchemePublishReq req = new SchemePublishReq();

        assertThrows(EclException.class, () -> publishService.publish("SCH_001", req));
    }

    @Test
    void publish_WhenExpired_ShouldThrow() {
        EclSchemeEntity expired = createTestEntity("SCH_001", "EXPIRED");
        when(schemeMapper.selectById("SCH_001")).thenReturn(expired);

        SchemePublishReq req = new SchemePublishReq();

        assertThrows(EclException.class, () -> publishService.publish("SCH_001", req));
    }

    @Test
    void publish_WhenNotExists_ShouldThrow() {
        when(schemeMapper.selectById("NOT_EXIST")).thenReturn(null);

        SchemePublishReq req = new SchemePublishReq();

        assertThrows(EclException.class, () -> publishService.publish("NOT_EXIST", req));
    }

    // ==================== VO fields after publish ====================

    @Test
    void publish_ShouldReturnCompleteVo() {
        EclSchemeEntity draft = createTestEntity("SCH_001", "DRAFT");
        when(schemeMapper.selectById("SCH_001")).thenReturn(draft);
        when(schemeMapper.selectEffective()).thenReturn(null);

        SchemePublishReq req = new SchemePublishReq();
        req.setImmediate(true);

        SchemeVO result = publishService.publish("SCH_001", req);

        assertNotNull(result.getSchemeId());
        assertNotNull(result.getSchemeCode());
        assertNotNull(result.getSchemeName());
        assertNotNull(result.getSchemeVersion());
        assertEquals("EFFECTIVE", result.getStatus());
        assertEquals("已生效", result.getStatusDisplay());
        assertNotNull(result.getEffectiveDate());
        assertNotNull(result.getEffectiveAt());
    }
}

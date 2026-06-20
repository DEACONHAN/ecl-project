package com.bank.ecl.parameter.copy.publish;

import com.bank.ecl.common.constant.SchemeStatus;
import com.bank.ecl.common.util.UuidGenerator;
import com.bank.ecl.data.entity.EclSchemeEntity;
import com.bank.ecl.data.mapper.EclSchemeMapper;
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
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SchemePublishJobTest {

    @Mock
    private EclSchemeMapper schemeMapper;

    @InjectMocks
    private SchemePublishJob publishJob;

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

    @Test
    void autoEffective_ShouldActivatePublishedAndExpireOld() {
        // Arrange: one published scheme due today, one old effective
        EclSchemeEntity published = createTestEntity("SCH_002", "PUBLISHED");
        published.setEffectiveDate(LocalDate.now().minusDays(1));

        EclSchemeEntity oldEffective = createTestEntity("SCH_001", "EFFECTIVE");

        when(schemeMapper.selectList(any())).thenReturn(List.of(published));
        when(schemeMapper.selectEffective()).thenReturn(oldEffective);

        // Act
        publishJob.autoEffective();

        // Assert: two updates (expire old + activate new)
        verify(schemeMapper, times(2)).updateById(entityCaptor.capture());
        var allUpdates = entityCaptor.getAllValues();

        boolean foundExpired = allUpdates.stream().anyMatch(e -> "EXPIRED".equals(e.getStatus()));
        assertTrue(foundExpired, "旧方案应被设为 EXPIRED");

        boolean foundEffective = allUpdates.stream().anyMatch(e -> "EFFECTIVE".equals(e.getStatus()));
        assertTrue(foundEffective, "新方案应被设为 EFFECTIVE");
    }

    @Test
    void autoEffective_WhenNoOldEffective_ShouldStillActivate() {
        // Arrange
        EclSchemeEntity published = createTestEntity("SCH_001", "PUBLISHED");
        published.setEffectiveDate(LocalDate.now().minusDays(1));

        when(schemeMapper.selectList(any())).thenReturn(List.of(published));
        when(schemeMapper.selectEffective()).thenReturn(null);

        // Act
        publishJob.autoEffective();

        // Assert: only the activation update
        verify(schemeMapper, times(1)).updateById(entityCaptor.capture());
        assertEquals("EFFECTIVE", entityCaptor.getValue().getStatus());
    }

    @Test
    void autoEffective_WhenOldEffectiveIsSameScheme_ShouldNotExpire() {
        // Arrange
        EclSchemeEntity published = createTestEntity("SCH_001", "PUBLISHED");
        published.setEffectiveDate(LocalDate.now().minusDays(1));

        when(schemeMapper.selectList(any())).thenReturn(List.of(published));
        when(schemeMapper.selectEffective()).thenReturn(published); // same schemeId

        // Act
        publishJob.autoEffective();

        // Assert: only the activation update (no expire)
        verify(schemeMapper, times(1)).updateById(any(EclSchemeEntity.class));
    }

    @Test
    void autoEffective_WhenMultiplePublished_ShouldProcessAll() {
        // Arrange
        EclSchemeEntity pub1 = createTestEntity("SCH_002", "PUBLISHED");
        pub1.setEffectiveDate(LocalDate.now().minusDays(1));
        EclSchemeEntity pub2 = createTestEntity("SCH_003", "PUBLISHED");
        pub2.setEffectiveDate(LocalDate.now().minusDays(3));

        EclSchemeEntity oldEffective = createTestEntity("SCH_001", "EFFECTIVE");

        when(schemeMapper.selectList(any())).thenReturn(List.of(pub1, pub2));
        // selectEffective() is called once before the loop, returns the old effective
        when(schemeMapper.selectEffective()).thenReturn(oldEffective);

        // Act
        publishJob.autoEffective();

        // Assert: 1 expire(old) + 2 activate(new) = 3 updates
        verify(schemeMapper, times(3)).updateById(any(EclSchemeEntity.class));
    }

    @Test
    void autoEffective_WhenNoPendingSchemes_ShouldDoNothing() {
        // Arrange
        when(schemeMapper.selectList(any())).thenReturn(List.of());

        // Act
        publishJob.autoEffective();

        // Assert
        verify(schemeMapper, never()).updateById(any(EclSchemeEntity.class));
        verify(schemeMapper, never()).selectEffective();
    }

    @Test
    void autoEffective_ShouldSetEffectiveAtAndUpdatedAt() {
        // Arrange
        EclSchemeEntity published = createTestEntity("SCH_001", "PUBLISHED");
        published.setEffectiveDate(LocalDate.now().minusDays(1));
        published.setEffectiveAt(null);

        when(schemeMapper.selectList(any())).thenReturn(List.of(published));
        when(schemeMapper.selectEffective()).thenReturn(null);

        // Act
        publishJob.autoEffective();

        // Assert
        verify(schemeMapper).updateById(entityCaptor.capture());
        EclSchemeEntity updated = entityCaptor.getValue();
        assertEquals("EFFECTIVE", updated.getStatus());
        assertNotNull(updated.getEffectiveAt(), "effective_at 应被设置");
        assertNotNull(updated.getUpdatedAt(), "updated_at 应被设置");
    }
}

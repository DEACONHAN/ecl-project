package com.bank.ecl.parameter.riskgroup;

import com.bank.ecl.common.constant.SchemeStatus;
import com.bank.ecl.common.exception.EclException;
import com.bank.ecl.data.entity.EclSchemeEntity;
import com.bank.ecl.data.entity.RiskGroupEntity;
import com.bank.ecl.data.mapper.EclSchemeMapper;
import com.bank.ecl.data.mapper.RiskGroupDetailMapper;
import com.bank.ecl.data.mapper.RiskGroupMapper;
import com.bank.ecl.parameter.riskgroup.dto.RiskGroupCreateReq;
import com.bank.ecl.parameter.riskgroup.dto.RiskGroupVO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RiskGroupServiceImplTest {

    @Mock private RiskGroupMapper riskGroupMapper;
    @Mock private RiskGroupDetailMapper riskGroupDetailMapper;
    @Mock private EclSchemeMapper eclSchemeMapper;

    @InjectMocks
    private RiskGroupServiceImpl riskGroupService;

    @Captor
    private ArgumentCaptor<RiskGroupEntity> groupCaptor;

    @Test
    void createGroup_WhenGroupCodeAndSortOrderProvided_ShouldUseProvidedValues() {
        EclSchemeEntity scheme = new EclSchemeEntity();
        scheme.setSchemeId("scheme-1");
        scheme.setStatus(SchemeStatus.DRAFT.name());
        AtomicReference<RiskGroupEntity> insertedGroup = new AtomicReference<>();
        when(eclSchemeMapper.selectById("scheme-1")).thenReturn(scheme);
        when(riskGroupMapper.insert(any(RiskGroupEntity.class))).thenAnswer(invocation -> {
            RiskGroupEntity entity = invocation.getArgument(0);
            insertedGroup.set(entity);
            return 1;
        });
        when(riskGroupMapper.selectById(any())).thenAnswer(invocation -> {
            String groupId = invocation.getArgument(0);
            RiskGroupEntity entity = insertedGroup.get();
            entity.setGroupId(groupId);
            return entity;
        });
        when(riskGroupDetailMapper.selectList(any())).thenReturn(List.of());

        RiskGroupCreateReq req = new RiskGroupCreateReq();
        req.setSchemeId("scheme-1");
        req.setGroupCode("CORP");
        req.setGroupName("对公业务");
        req.setSortOrder(10);
        req.setDescription("对公客户");

        RiskGroupVO result = riskGroupService.createGroup(req);

        verify(riskGroupMapper).insert(groupCaptor.capture());
        RiskGroupEntity inserted = groupCaptor.getValue();
        assertEquals("CORP", inserted.getGroupCode());
        assertEquals(10, inserted.getSortOrder());
        assertEquals("CORP", result.getGroupCode());
        assertEquals(10, result.getSortOrder());
        verify(riskGroupMapper, never()).selectMaxRiskGroupSeq();
    }

    @Test
    void createGroup_WhenSchemeIsNotDraft_ShouldThrow() {
        EclSchemeEntity scheme = new EclSchemeEntity();
        scheme.setSchemeId("scheme-1");
        scheme.setStatus(SchemeStatus.EFFECTIVE.name());
        when(eclSchemeMapper.selectById("scheme-1")).thenReturn(scheme);

        RiskGroupCreateReq req = new RiskGroupCreateReq();
        req.setSchemeId("scheme-1");
        req.setGroupCode("CORP");
        req.setGroupName("对公业务");

        assertThrows(EclException.class, () -> riskGroupService.createGroup(req));
    }
}

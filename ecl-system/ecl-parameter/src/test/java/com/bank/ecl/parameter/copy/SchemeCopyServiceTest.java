package com.bank.ecl.parameter.copy;

import com.bank.ecl.data.entity.*;
import com.bank.ecl.data.mapper.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SchemeCopyServiceTest {

    @Mock private RiskGroupMapper riskGroupMapper;
    @Mock private RiskGroupDetailMapper riskGroupDetailMapper;
    @Mock private StageRuleMapper stageRuleMapper;
    @Mock private CrrRatingDropRuleMapper crrRatingDropRuleMapper;
    @Mock private PdScenarioMapper pdScenarioMapper;
    @Mock private PdCurveMapper pdCurveMapper;
    @Mock private LgdCurveMapper lgdCurveMapper;
    @Mock private LgdCollateralDiscountMapper lgdCollateralDiscountMapper;
    @Mock private LgdDepreciationMapper lgdDepreciationMapper;
    @Mock private CcfCurveMapper ccfCurveMapper;
    @Mock private OverlayRuleMapper overlayRuleMapper;

    @InjectMocks
    private SchemeCopyService copyService;

    @Captor
    private ArgumentCaptor<RiskGroupEntity> riskGroupCaptor;

    private RiskGroupEntity createGroup(String groupId, String schemeId) {
        RiskGroupEntity g = new RiskGroupEntity();
        g.setGroupId(groupId);
        g.setSchemeId(schemeId);
        g.setGroupName("风险组-" + groupId);
        return g;
    }

    private RiskGroupDetailEntity createDetail(String schemeId, String groupId) {
        RiskGroupDetailEntity d = new RiskGroupDetailEntity();
        d.setDetailId(null);
        d.setSchemeId(schemeId);
        d.setGroupId(groupId);
        return d;
    }

    private StageRuleEntity createStageRule(String schemeId, String groupId) {
        StageRuleEntity r = new StageRuleEntity();
        r.setRuleId(null);
        r.setSchemeId(schemeId);
        r.setGroupId(groupId);
        r.setRuleType("DEFAULT");
        return r;
    }

    @Test
    void copyAll_ShouldCopyAllModules() {
        // Arrange
        String sourceSchemeId = "src_001";
        String targetSchemeId = "tgt_001";
        String oldGroupId = "g_001";

        RiskGroupEntity group = createGroup(oldGroupId, sourceSchemeId);
        when(riskGroupMapper.selectList(any())).thenReturn(List.of(group));

        RiskGroupDetailEntity detail = createDetail(sourceSchemeId, oldGroupId);
        when(riskGroupDetailMapper.selectList(any())).thenReturn(List.of(detail));

        StageRuleEntity stageRule = createStageRule(sourceSchemeId, oldGroupId);
        when(stageRuleMapper.selectList(any())).thenReturn(List.of(stageRule));

        when(crrRatingDropRuleMapper.selectList(any())).thenReturn(List.of());

        PdScenarioEntity scenario = new PdScenarioEntity();
        scenario.setScenarioId(1L);
        scenario.setSchemeId(sourceSchemeId);
        when(pdScenarioMapper.selectList(any())).thenReturn(List.of(scenario));
        // Simulate auto-generated scenario ID
        when(pdScenarioMapper.insert(any(PdScenarioEntity.class))).thenAnswer(invocation -> {
            PdScenarioEntity s = invocation.getArgument(0);
            s.setScenarioId(100L);
            return 1;
        });

        when(pdCurveMapper.selectList(any())).thenReturn(List.of());
        when(lgdCurveMapper.selectList(any())).thenReturn(List.of());
        when(lgdCollateralDiscountMapper.selectList(any())).thenReturn(List.of());
        when(lgdDepreciationMapper.selectList(any())).thenReturn(List.of());
        when(ccfCurveMapper.selectList(any())).thenReturn(List.of());
        when(overlayRuleMapper.selectList(any())).thenReturn(List.of());

        // Act
        copyService.copyAll(sourceSchemeId, targetSchemeId);

        // Assert: risk group inserted with new ID and target scheme
        verify(riskGroupMapper).insert(argThat((RiskGroupEntity g) ->
                !oldGroupId.equals(g.getGroupId()) && targetSchemeId.equals(g.getSchemeId())
        ));

        // Assert: detail inserted with target scheme
        verify(riskGroupDetailMapper).insert(argThat((RiskGroupDetailEntity d) ->
                targetSchemeId.equals(d.getSchemeId())
        ));

        // Assert: pd_scenario inserted with target scheme
        verify(pdScenarioMapper).insert(argThat((PdScenarioEntity s) ->
                targetSchemeId.equals(s.getSchemeId())
        ));
    }

    @Test
    void copyAll_WhenSourceHasNoData_ShouldNotThrow() {
        // Arrange: all tables empty
        String srcId = "src_001";
        String tgtId = "tgt_001";

        when(riskGroupMapper.selectList(any())).thenReturn(List.of());
        when(riskGroupDetailMapper.selectList(any())).thenReturn(List.of());
        when(stageRuleMapper.selectList(any())).thenReturn(List.of());
        when(crrRatingDropRuleMapper.selectList(any())).thenReturn(List.of());
        when(pdScenarioMapper.selectList(any())).thenReturn(List.of());
        when(pdCurveMapper.selectList(any())).thenReturn(List.of());
        when(lgdCurveMapper.selectList(any())).thenReturn(List.of());
        when(lgdCollateralDiscountMapper.selectList(any())).thenReturn(List.of());
        when(lgdDepreciationMapper.selectList(any())).thenReturn(List.of());
        when(ccfCurveMapper.selectList(any())).thenReturn(List.of());
        when(overlayRuleMapper.selectList(any())).thenReturn(List.of());

        // Act (should not throw)
        copyService.copyAll(srcId, tgtId);

        // Assert: no insert calls for any module (no source data)
        verify(riskGroupMapper, never()).insert(any(RiskGroupEntity.class));
        verify(pdScenarioMapper, never()).insert(any(PdScenarioEntity.class));
        verify(overlayRuleMapper, never()).insert(any(OverlayRuleEntity.class));
    }

    @Test
    void copyAll_ShouldRemapGroupIdInAllEntities() {
        // Arrange
        String srcId = "src_001";
        String tgtId = "tgt_001";
        String oldGroupId = "g_old_001";

        RiskGroupEntity group = createGroup(oldGroupId, srcId);
        when(riskGroupMapper.selectList(any())).thenReturn(List.of(group));

        // Stage rule with old groupId
        StageRuleEntity stage = createStageRule(srcId, oldGroupId);
        when(stageRuleMapper.selectList(any())).thenReturn(List.of(stage));

        // Crr drop rule with old groupId
        CrrRatingDropRuleEntity drop = new CrrRatingDropRuleEntity();
        drop.setDropRuleId(null);
        drop.setSchemeId(srcId);
        drop.setGroupId(oldGroupId);
        when(crrRatingDropRuleMapper.selectList(any())).thenReturn(List.of(drop));

        when(riskGroupDetailMapper.selectList(any())).thenReturn(List.of());
        when(pdScenarioMapper.selectList(any())).thenReturn(List.of());
        when(pdCurveMapper.selectList(any())).thenReturn(List.of());
        when(lgdCurveMapper.selectList(any())).thenReturn(List.of());
        when(lgdCollateralDiscountMapper.selectList(any())).thenReturn(List.of());
        when(lgdDepreciationMapper.selectList(any())).thenReturn(List.of());
        when(ccfCurveMapper.selectList(any())).thenReturn(List.of());
        when(overlayRuleMapper.selectList(any())).thenReturn(List.of());

        // Act
        copyService.copyAll(srcId, tgtId);

        // Capture the generated new group ID
        verify(riskGroupMapper).insert(riskGroupCaptor.capture());
        String newGroupId = riskGroupCaptor.getValue().getGroupId();
        assertNotNull(newGroupId);
        assertNotEquals(oldGroupId, newGroupId);

        // Stage rule should have the new groupId
        verify(stageRuleMapper).insert(argThat((StageRuleEntity r) -> newGroupId.equals(r.getGroupId())));
        // Crr drop rule should have the new groupId
        verify(crrRatingDropRuleMapper).insert(argThat((CrrRatingDropRuleEntity r) -> newGroupId.equals(r.getGroupId())));
    }
}

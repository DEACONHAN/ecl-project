package com.bank.ecl.engine.output;

import com.bank.ecl.data.entity.EclCalcDetailEntity;
import com.bank.ecl.data.mapper.EclCalcDetailMapper;
import com.bank.ecl.engine.core.*;
import com.bank.ecl.engine.stage.StageResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OutputEngineTest {
    @Mock
    private EclCalcDetailMapper calcDetailMapper;
    private OutputEngine engine;

    @BeforeEach
    void setUp() {
        engine = new OutputEngine(calcDetailMapper);
    }

    @Test
    void shouldInsertSingleAsset() {
        AssetInput a = new AssetInput();
        a.setAssetId("AST_001");
        a.setGroupId("GRP_001");
        a.setPd12m(0.02);
        a.setPdLifetime(0.02);
        a.setLgdValue(0.45);
        a.setTotalEad(1000.0);
        a.setEclValue(9.0);
        a.setOverlayAmount(0.0);
        a.setEclFinal(9.0);
        a.setStageResult(new StageResult(Stage.STAGE_1, "test", false));

        CustomerContext cust = new CustomerContext();
        cust.setAssets(List.of(a));
        JobContext ctx = new JobContext();
        ctx.setJobId("JOB_001");
        ctx.setSchemeId("SCH_001");
        ctx.setCustomers(List.of(cust));

        engine.execute(ctx);

        ArgumentCaptor<EclCalcDetailEntity> captor = ArgumentCaptor.forClass(EclCalcDetailEntity.class);
        verify(calcDetailMapper, times(1)).insert(captor.capture());
        EclCalcDetailEntity e = captor.getValue();
        assertEquals("AST_001", e.getAssetId());
        assertEquals("JOB_001", e.getJobId());
        assertEquals(BigDecimal.valueOf(9.0), e.getEclFinal());
        assertEquals("SUCCESS", e.getCalcStatus());
    }

    @Test
    void shouldSetPartialStatusWhenExceptions() {
        AssetInput a = new AssetInput();
        a.setAssetId("AST_002");
        a.setPdException("ECL_001");
        a.setLgdException("WARN");
        a.setLgdValue(0.45);
        a.setTotalEad(500.0);

        CustomerContext cust = new CustomerContext();
        cust.setAssets(List.of(a));
        JobContext ctx = new JobContext();
        ctx.setCustomers(List.of(cust));

        engine.execute(ctx);

        ArgumentCaptor<EclCalcDetailEntity> captor = ArgumentCaptor.forClass(EclCalcDetailEntity.class);
        verify(calcDetailMapper).insert(captor.capture());
        assertEquals("PARTIAL", captor.getValue().getCalcStatus());
        assertNotNull(captor.getValue().getErrorSummary());
    }
}

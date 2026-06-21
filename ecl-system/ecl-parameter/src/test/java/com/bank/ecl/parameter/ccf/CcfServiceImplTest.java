package com.bank.ecl.parameter.ccf;

import com.bank.ecl.common.constant.SchemeStatus;
import com.bank.ecl.data.entity.CcfCurveEntity;
import com.bank.ecl.data.entity.EclSchemeEntity;
import com.bank.ecl.data.mapper.CcfCurveMapper;
import com.bank.ecl.data.mapper.EclSchemeMapper;
import com.bank.ecl.parameter.ccf.dto.CcfCurveCreateReq;
import com.bank.ecl.parameter.ccf.dto.CcfCurveVO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CcfServiceImplTest {

    @Mock private CcfCurveMapper ccfCurveMapper;
    @Mock private EclSchemeMapper eclSchemeMapper;

    @InjectMocks
    private CcfServiceImpl ccfService;

    @Captor private ArgumentCaptor<CcfCurveEntity> curveCaptor;

    @Test
    void createCurve_WithFrontendDayFields_ShouldPersistAndReturnAliases() {
        when(eclSchemeMapper.selectById("scheme-1")).thenReturn(draftScheme());
        when(ccfCurveMapper.insert(any(CcfCurveEntity.class))).thenAnswer(invocation -> {
            CcfCurveEntity entity = invocation.getArgument(0);
            entity.setCurveId(100L);
            return 1;
        });

        CcfCurveCreateReq req = new CcfCurveCreateReq();
        req.setSchemeId("scheme-1");
        req.setProductType("LOAN");
        req.setCommitmentType("REVOCABLE");
        req.setDaysMin(0);
        req.setDaysMax(365);
        req.setCcfValue(new BigDecimal("0.35"));

        CcfCurveVO result = ccfService.createCurve(req);

        verify(ccfCurveMapper).insert(curveCaptor.capture());
        CcfCurveEntity inserted = curveCaptor.getValue();
        assertEquals(0, inserted.getCommitmentDaysMin());
        assertEquals(365, inserted.getCommitmentDaysMax());
        assertEquals(0, result.getDaysMin());
        assertEquals(365, result.getDaysMax());
    }

    @Test
    void batchUpdateCurves_WithOuterSchemeIdAndFrontendDayFields_ShouldPersistRows() {
        when(eclSchemeMapper.selectById("scheme-1")).thenReturn(draftScheme());

        CcfCurveCreateReq item = new CcfCurveCreateReq();
        item.setProductType("LOAN");
        item.setCommitmentType("REVOCABLE");
        item.setDaysMin(0);
        item.setDaysMax(365);
        item.setCcfValue(new BigDecimal("0.35"));

        ccfService.batchUpdateCurves("scheme-1", List.of(item));

        verify(ccfCurveMapper).insert(curveCaptor.capture());
        CcfCurveEntity inserted = curveCaptor.getValue();
        assertEquals("scheme-1", inserted.getSchemeId());
        assertEquals(0, inserted.getCommitmentDaysMin());
        assertEquals(365, inserted.getCommitmentDaysMax());
    }

    private EclSchemeEntity draftScheme() {
        EclSchemeEntity scheme = new EclSchemeEntity();
        scheme.setSchemeId("scheme-1");
        scheme.setStatus(SchemeStatus.DRAFT.name());
        return scheme;
    }
}

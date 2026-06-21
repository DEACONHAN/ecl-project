package com.bank.ecl.parameter.lgd;

import com.bank.ecl.common.constant.SchemeStatus;
import com.bank.ecl.data.entity.EclSchemeEntity;
import com.bank.ecl.data.entity.LgdCollateralDiscountEntity;
import com.bank.ecl.data.entity.LgdDepreciationEntity;
import com.bank.ecl.data.mapper.EclSchemeMapper;
import com.bank.ecl.data.mapper.LgdCollateralDiscountMapper;
import com.bank.ecl.data.mapper.LgdCurveMapper;
import com.bank.ecl.data.mapper.LgdDepreciationMapper;
import com.bank.ecl.parameter.lgd.dto.LgdCollateralDiscountCreateReq;
import com.bank.ecl.parameter.lgd.dto.LgdCollateralDiscountVO;
import com.bank.ecl.parameter.lgd.dto.LgdDepreciationVO;
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
class LgdServiceImplTest {

    @Mock private LgdCurveMapper lgdCurveMapper;
    @Mock private LgdCollateralDiscountMapper lgdCollateralDiscountMapper;
    @Mock private LgdDepreciationMapper lgdDepreciationMapper;
    @Mock private EclSchemeMapper eclSchemeMapper;

    @InjectMocks
    private LgdServiceImpl lgdService;

    @Captor private ArgumentCaptor<LgdCollateralDiscountEntity> discountCaptor;

    @Test
    void batchUpdateDiscounts_WithCollateralCategory_ShouldPersistCategory() {
        when(eclSchemeMapper.selectById("scheme-1")).thenReturn(draftScheme());

        LgdCollateralDiscountCreateReq req = new LgdCollateralDiscountCreateReq();
        req.setSchemeId("scheme-1");
        req.setCollateralCategory("REAL_ESTATE");
        req.setCollateralType("RESIDENTIAL");
        req.setDiscountRate(new BigDecimal("0.20"));

        lgdService.batchUpdateDiscounts("scheme-1", List.of(req));

        verify(lgdCollateralDiscountMapper).insert(discountCaptor.capture());
        LgdCollateralDiscountEntity inserted = discountCaptor.getValue();
        assertEquals("REAL_ESTATE", inserted.getCollateralCategory());
        assertEquals("RESIDENTIAL", inserted.getCollateralType());
    }

    @Test
    void listDiscounts_WithCollateralCategory_ShouldReturnCategory() {
        LgdCollateralDiscountEntity entity = new LgdCollateralDiscountEntity();
        entity.setDiscountId(100L);
        entity.setSchemeId("scheme-1");
        entity.setCollateralCategory("REAL_ESTATE");
        entity.setCollateralType("RESIDENTIAL");
        entity.setDiscountRate(new BigDecimal("0.20"));
        when(lgdCollateralDiscountMapper.selectList(any())).thenReturn(List.of(entity));

        List<LgdCollateralDiscountVO> result = lgdService.listDiscounts("scheme-1");

        assertEquals("REAL_ESTATE", result.get(0).getCollateralCategory());
        assertEquals("RESIDENTIAL", result.get(0).getCollateralType());
    }

    @Test
    void listDepreciations_WithoutCollateralType_ShouldReturnAllTypes() {
        LgdDepreciationEntity entity = new LgdDepreciationEntity();
        entity.setDepreciationId(200L);
        entity.setSchemeId("scheme-1");
        entity.setCollateralType("MACHINE");
        entity.setYearOffset(1);
        entity.setDepreciationRate(new BigDecimal("-0.10"));
        when(lgdDepreciationMapper.selectList(any())).thenReturn(List.of(entity));

        List<LgdDepreciationVO> result = lgdService.listDepreciations("scheme-1", null);

        assertEquals("MACHINE", result.get(0).getCollateralType());
        assertEquals(new BigDecimal("-0.10"), result.get(0).getDepreciationRate());
    }

    private EclSchemeEntity draftScheme() {
        EclSchemeEntity scheme = new EclSchemeEntity();
        scheme.setSchemeId("scheme-1");
        scheme.setStatus(SchemeStatus.DRAFT.name());
        return scheme;
    }
}

# Trial Source Input Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将试算中心改为按技术文档的数据源表手工录入并驱动新引擎口径，同时小范围适配参数层字段和结果展示。

**Architecture:** 先稳定后端试算请求/上下文模型，再用 `TrialSourceAssembler` 把页面录入的源数据表装配成引擎上下文。引擎按现有 dispatcher 顺序执行，参数层页面只做字段级调整，试算结果继续使用现有 `TrialStep` 展示结构。

**Tech Stack:** Java 21, Spring Boot 3.2, MyBatis-Plus, JUnit 5, Mockito, React 19, TypeScript, Ant Design 6, Vite.

---

## File Structure

Backend DTOs and assembly:

- Modify `ecl-system/ecl-calculation/src/main/java/com/bank/ecl/calculation/trial/dto/TrialCalculationReq.java` to carry source table rows.
- Modify `ecl-system/ecl-calculation/src/main/java/com/bank/ecl/calculation/trial/dto/AssetInputReq.java` or replace usages with table-row DTOs.
- Create `ecl-system/ecl-calculation/src/main/java/com/bank/ecl/calculation/trial/dto/TrialLoanRowReq.java`.
- Create `ecl-system/ecl-calculation/src/main/java/com/bank/ecl/calculation/trial/dto/TrialFacilityRowReq.java`.
- Create `ecl-system/ecl-calculation/src/main/java/com/bank/ecl/calculation/trial/dto/TrialRepaymentRowReq.java`.
- Create `ecl-system/ecl-calculation/src/main/java/com/bank/ecl/calculation/trial/dto/TrialCollateralRowReq.java`.
- Create `ecl-system/ecl-calculation/src/main/java/com/bank/ecl/calculation/trial/dto/TrialRatingRowReq.java`.
- Create `ecl-system/ecl-calculation/src/main/java/com/bank/ecl/calculation/trial/dto/TrialHistoricalStageRowReq.java`.
- Create `ecl-system/ecl-calculation/src/main/java/com/bank/ecl/calculation/trial/TrialSourceAssembler.java`.
- Create `ecl-system/ecl-calculation/src/test/java/com/bank/ecl/calculation/trial/TrialSourceAssemblerTest.java`.

Engine context:

- Modify `ecl-system/ecl-engine/src/main/java/com/bank/ecl/engine/core/AssetInput.java`.
- Modify `ecl-system/ecl-engine/src/main/java/com/bank/ecl/engine/core/CustomerContext.java`.
- Modify `ecl-system/ecl-engine/src/main/java/com/bank/ecl/engine/core/JobContext.java`.
- Create `ecl-system/ecl-engine/src/main/java/com/bank/ecl/engine/core/FacilityInput.java`.
- Create `ecl-system/ecl-engine/src/main/java/com/bank/ecl/engine/core/RepaymentScheduleInput.java`.
- Create `ecl-system/ecl-engine/src/main/java/com/bank/ecl/engine/core/CollateralInput.java`.
- Create `ecl-system/ecl-engine/src/main/java/com/bank/ecl/engine/core/PdScenarioResult.java`.
- Create `ecl-system/ecl-engine/src/main/java/com/bank/ecl/engine/core/EclScenarioResult.java`.

Parameter schema and APIs:

- Modify `ecl-system/ecl-data/src/main/resources/db/changelog/012-engine-alignment-fields.sql`.
- Modify `ecl-system/ecl-data/src/main/resources/db/changelog/db.changelog-master.xml`.
- Modify entities: `RiskGroupDetailEntity`, `CrrRatingDropRuleEntity`, `PdCurveEntity`, `EclSchemeEntity`.
- Modify parameter DTOs and services under `ecl-system/ecl-parameter/src/main/java/com/bank/ecl/parameter`.

Engines:

- Modify `RiskGroupEngine.java`, `StageEngine.java`, `StageConditionEvaluator.java`, `PdEngine.java`, `EadEngine.java`, `LgdEngine.java`, `EclCalcEngine.java`, `OverlayEngine.java`, `OutputEngine.java`.
- Update existing tests under `ecl-system/ecl-engine/src/test/java/com/bank/ecl/engine`.

Frontend:

- Modify `ecl-system/ecl-frontend/src/api/trial.ts`.
- Modify `ecl-system/ecl-frontend/src/pages/trial/TrialCenter.tsx`.
- Modify `ecl-system/ecl-frontend/src/pages/trial/TrialCenter.css`.
- Modify parameter pages only where fields change: `RiskGroupConfig.tsx`, `StageConfig.tsx`, `PdConfig.tsx`, `SchemeList.tsx` or scheme settings component, `LgdConfig.tsx`, `CcfConfig.tsx`.

---

### Task 1: Baseline and Branch Safety

**Files:**
- Read: `docs/superpowers/specs/2026-06-24-trial-source-input-alignment-design.md`
- Read: `2026-06-18-ECL_v3.1_技术设计说明书.md`

- [ ] **Step 1: Confirm current branch**

Run:

```bash
git branch --show-current
```

Expected:

```text
feature/trial-source-input-alignment
```

- [ ] **Step 2: Confirm unrelated dirty files**

Run:

```bash
git status --short
```

Expected: existing dirty files may include the technical document and `OutputEngine.java`. Do not revert them.

- [ ] **Step 3: Run backend engine baseline tests**

Run:

```bash
cd ecl-system && mvn -pl ecl-engine test
```

Expected: either pass, or record pre-existing failures before code changes.

- [ ] **Step 4: Run frontend build baseline**

Run:

```bash
cd ecl-system/ecl-frontend
npm run build
```

Expected: either pass, or record pre-existing failures before code changes.

---

### Task 2: Add Source-Table Trial DTOs

**Files:**
- Modify: `ecl-system/ecl-calculation/src/main/java/com/bank/ecl/calculation/trial/dto/TrialCalculationReq.java`
- Create: trial row DTO files listed in File Structure
- Test: `ecl-system/ecl-calculation/src/test/java/com/bank/ecl/calculation/trial/TrialSourceAssemblerTest.java`

- [ ] **Step 1: Write failing DTO serialization test**

Add this test skeleton:

```java
@Test
void shouldAcceptSourceTableRowsInTrialRequest() {
    TrialCalculationReq req = new TrialCalculationReq();
    req.setSchemeId("SCH_001");
    req.setCalcDate(LocalDate.of(2026, 6, 24));

    TrialLoanRowReq loan = new TrialLoanRowReq();
    loan.setId("LN_001");
    loan.setFacilityCd("FAC_001");
    loan.setCustomerNo("CUST_001");
    loan.setCustomerName("客户A");
    loan.setSegment("2 Loan");
    loan.setProductType("公司贷款");
    loan.setIndustryCn("制造业");
    loan.setGuaranteeType("房产抵押");
    loan.setCurrencyCd("CNY");
    loan.setAmtFinancedCny(new BigDecimal("1000000"));
    loan.setLoanBalCny(new BigDecimal("800000"));
    loan.setIntAccruedCny(new BigDecimal("1000"));
    loan.setInterestRate(new BigDecimal("0.045"));
    loan.setLoanStartDt(LocalDate.of(2025, 1, 1));
    loan.setLoanMaturityDt(LocalDate.of(2028, 1, 1));
    loan.setOverdueDays(0);
    loan.setIsNpl("N");
    loan.setNormalConsecutiveDays(200);
    loan.setBusinessType("ON_BS");

    req.setLoans(List.of(loan));

    assertEquals("LN_001", req.getLoans().get(0).getId());
    assertEquals("房产抵押", req.getLoans().get(0).getGuaranteeType());
}
```

- [ ] **Step 2: Run test and verify it fails to compile**

Run:

```bash
cd ecl-system && mvn -pl ecl-calculation -Dtest=TrialSourceAssemblerTest#shouldAcceptSourceTableRowsInTrialRequest test
```

Expected: compile failure because `TrialLoanRowReq` and `loans` do not exist.

- [ ] **Step 3: Add DTO classes**

Create DTOs with Lombok `@Data`. Include these fields:

```java
// TrialLoanRowReq
private LocalDate reportDt;
private String id;
private String facilityCd;
private String customerNo;
private String customerName;
private String industryCn;
private String subIndustry1;
private String subIndustry2;
private String segment;
private String subProductCd;
private String productType;
private String currencyCd;
private BigDecimal amtFinancedFcy;
private BigDecimal loanBalFcy;
private BigDecimal intAccruedFcy;
private BigDecimal fxRateContractToCny;
private BigDecimal amtFinancedCny;
private BigDecimal loanBalCny;
private BigDecimal intAccruedCny;
private BigDecimal interestRate;
private LocalDate loanStartDt;
private LocalDate loanMaturityDt;
private BigDecimal remainingYrsToMaturity;
private Integer overdueDays;
private String loanClassifCd;
private String isNpl;
private String loanStatus;
private BigDecimal penaltyInterest;
private String affiliatedGroup;
private String isSoe;
private String guaranteeType;
private Integer normalConsecutiveDays;
private String otherRiskInfo;
private String businessType;
private BigDecimal overduePrincipal;
private BigDecimal overdueInterest;
```

```java
// TrialFacilityRowReq
private String facilityCd;
private String limitCurrencyCd;
private BigDecimal fxRateLimitToCny;
private BigDecimal limitAmtFcy;
private BigDecimal limitAmtCny;
private BigDecimal limitAvailAmtFcy;
private BigDecimal limitAvailAmtCny;
private BigDecimal undrawnAmtCny;
private String commitWithdrawFlg;
private String isRevolving;
private String calcTypeCd;
private LocalDate facilityStartDate;
private LocalDate facilityMaturityDate;
private BigDecimal usedLimit;
private String collateralPoolId;
private String cifNo;
private String customerName;
```

```java
// TrialRepaymentRowReq
private String loanReceiptNo;
private Integer totalPeriods;
private Integer periodNo;
private LocalDate dueDate;
private BigDecimal duePrincipal;
private BigDecimal dueInterest;
```

```java
// TrialCollateralRowReq
private String branchCode;
private String cifNo;
private String customerName;
private String facilityUniqueCode;
private String facilityNumber;
private String guaranteeContractNo;
private String collateralType;
private String collateralCategory;
private String categoryDesc;
private String collateralCode;
private String collateralPoolCode;
private String collateralStatus;
private String collateralDesc;
private LocalDate collateralStartDate;
private LocalDate collateralEndDate;
private String collateralCurrency;
private BigDecimal collateralValue;
private String reportCurrency;
private BigDecimal collateralValueFcy;
private String appraisalCompany;
private LocalDate appraisalEffectiveDate;
private LocalDate appraisalExpiryDate;
private BigDecimal appraisalValue;
private String guaranteeMethod;
```

```java
// TrialRatingRowReq
private String cifNo;
private String customerName;
private String extRatingCoLastYear;
private String extRatingLastYear;
private String crrIntLastYear;
private String extRatingCoThisYear;
private String extRatingThisYear;
private String crrIntThisYear;
private String crrFinal;
```

```java
// TrialHistoricalStageRowReq
private String assetId;
private LocalDate calcDate;
private String stageResult;
```

- [ ] **Step 4: Modify `TrialCalculationReq`**

Add:

```java
private List<TrialLoanRowReq> loans = new ArrayList<>();
private List<TrialFacilityRowReq> facilities = new ArrayList<>();
private List<TrialRepaymentRowReq> repaymentSchedules = new ArrayList<>();
private List<TrialCollateralRowReq> collaterals = new ArrayList<>();
private List<TrialRatingRowReq> ratings = new ArrayList<>();
private List<TrialHistoricalStageRowReq> historicalStages = new ArrayList<>();
```

Keep legacy fields temporarily so the application compiles during migration.

- [ ] **Step 5: Run DTO test**

Run:

```bash
cd ecl-system && mvn -pl ecl-calculation -Dtest=TrialSourceAssemblerTest#shouldAcceptSourceTableRowsInTrialRequest test
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add ecl-system/ecl-calculation/src/main/java/com/bank/ecl/calculation/trial/dto ecl-system/ecl-calculation/src/test/java/com/bank/ecl/calculation/trial/TrialSourceAssemblerTest.java
git commit -m "feat: add trial source table DTOs"
```

---

### Task 3: Expand Engine Context Model

**Files:**
- Modify: `AssetInput.java`, `CustomerContext.java`, `JobContext.java`
- Create: `FacilityInput.java`, `RepaymentScheduleInput.java`, `CollateralInput.java`, `PdScenarioResult.java`, `EclScenarioResult.java`
- Test: `TrialSourceAssemblerTest.java`

- [ ] **Step 1: Write failing context mapping test**

Add:

```java
@Test
void shouldMapLoanFacilityRatingAndCollateralPoolIntoEngineContext() {
    TrialCalculationReq req = TrialSourceFixtures.oneLoanOneFacilityOneCollateral();
    JobContext ctx = assembler.assemble("JOB_001", "SCH_001", LocalDate.of(2026, 6, 24), req, 0.05, 0.0, 0.45, 0.1);

    AssetInput asset = ctx.getCustomers().get(0).getAssets().get(0);
    assertEquals("LN_001", asset.getAssetId());
    assertEquals("2 Loan", asset.getBusinessLine());
    assertEquals("制造业", asset.getIndustryCode());
    assertEquals("房产抵押", asset.getCollateralType());
    assertEquals("N", asset.getIsNpl());
    assertEquals("CRR5", asset.getCrrFinal());
    assertEquals("MOODY", asset.getExtRatingCoThisYear());
    assertEquals("FAC_001", asset.getFacilityCd());
    assertEquals("POOL_001", asset.getCollateralPoolId());

    assertEquals(1, ctx.getFacilities().size());
    assertEquals(1, ctx.getCollateralsByPool().get("POOL_001").size());
}
```

- [ ] **Step 2: Run test and verify compile failure**

Run:

```bash
cd ecl-system && mvn -pl ecl-calculation -Dtest=TrialSourceAssemblerTest#shouldMapLoanFacilityRatingAndCollateralPoolIntoEngineContext test
```

Expected: compile failure for missing context fields/classes.

- [ ] **Step 3: Add context fields**

Add to `AssetInput`:

```java
private String facilityCd;
private String customerNo;
private String customerName;
private String segment;
private String businessType;
private String isNpl;
private Integer normalConsecutiveDays;
private String otherRiskInfo;
private String crrIntLastYear;
private String crrIntThisYear;
private String crrFinal;
private String extRatingCoLastYear;
private String extRatingLastYear;
private String extRatingCoThisYear;
private String extRatingThisYear;
private BigDecimal amtFinancedCny;
private BigDecimal overduePrincipal;
private BigDecimal overdueInterest;
private String collateralPoolId;
private List<RepaymentScheduleInput> repaymentSchedules = new ArrayList<>();
private List<PdScenarioResult> pdScenarioResults = new ArrayList<>();
private List<EclScenarioResult> eclScenarioResults = new ArrayList<>();
private String eadBreakdown;
private String lgdDetails;
```

Add to `JobContext`:

```java
private LocalDate calcDate;
private double lgdFloor;
private List<FacilityInput> facilities = new ArrayList<>();
private Map<String, List<CollateralInput>> collateralsByPool = new HashMap<>();
```

Create simple `@Data` classes for `FacilityInput`, `RepaymentScheduleInput`, and `CollateralInput` using the fields from the DTOs that engines need.

- [ ] **Step 4: Run context mapping test**

Run:

```bash
cd ecl-system && mvn -pl ecl-calculation -Dtest=TrialSourceAssemblerTest#shouldMapLoanFacilityRatingAndCollateralPoolIntoEngineContext test
```

Expected: compile failure only because assembler is not implemented.

- [ ] **Step 5: Commit**

```bash
git add ecl-system/ecl-engine/src/main/java/com/bank/ecl/engine/core ecl-system/ecl-calculation/src/test/java/com/bank/ecl/calculation/trial/TrialSourceAssemblerTest.java
git commit -m "feat: expand engine trial context model"
```

---

### Task 4: Implement Trial Source Assembler

**Files:**
- Create: `TrialSourceAssembler.java`
- Modify: `TrialCalculationService.java`
- Test: `TrialSourceAssemblerTest.java`

- [ ] **Step 1: Write failing assembler validation test**

Add:

```java
@Test
void shouldRejectTrialWithoutLoanRows() {
    TrialCalculationReq req = new TrialCalculationReq();
    req.setLoans(List.of());

    EclException ex = assertThrows(EclException.class,
            () -> assembler.assemble("JOB_001", "SCH_001", LocalDate.of(2026, 6, 24), req, 0.05, 0.0, 0.45, 0.1));

    assertTrue(ex.getMessage().contains("借据信息表不能为空"));
}
```

- [ ] **Step 2: Run assembler tests and verify failure**

Run:

```bash
cd ecl-system && mvn -pl ecl-calculation -Dtest=TrialSourceAssemblerTest test
```

Expected: compile failure or assertion failure because `TrialSourceAssembler` does not exist.

- [ ] **Step 3: Implement assembler constructor and method**

Create:

```java
@Component
public class TrialSourceAssembler {
    public JobContext assemble(String jobId, String schemeId, LocalDate calcDate, TrialCalculationReq req,
                               double discountRate, double defaultCcf, double defaultLgd, double lgdFloor) {
        if (req.getLoans() == null || req.getLoans().isEmpty()) {
            throw new EclException(ErrorCode.ECL_005, "借据信息表不能为空");
        }
        JobContext ctx = new JobContext();
        ctx.setJobId(jobId);
        ctx.setSchemeId(schemeId);
        ctx.setCalcDate(calcDate);
        ctx.setTrialMode(true);
        ctx.setDiscountRate(discountRate);
        ctx.setDefaultCcf(defaultCcf);
        ctx.setDefaultLgd(defaultLgd);
        ctx.setLgdFloor(lgdFloor);

        Map<String, TrialFacilityRowReq> facilityByCd = req.getFacilities().stream()
                .collect(Collectors.toMap(TrialFacilityRowReq::getFacilityCd, Function.identity(), (a, b) -> a));
        Map<String, TrialRatingRowReq> ratingByCif = req.getRatings().stream()
                .collect(Collectors.toMap(TrialRatingRowReq::getCifNo, Function.identity(), (a, b) -> a));
        Map<String, List<TrialRepaymentRowReq>> schedulesByLoan = req.getRepaymentSchedules().stream()
                .collect(Collectors.groupingBy(TrialRepaymentRowReq::getLoanReceiptNo));
        Map<String, List<TrialCollateralRowReq>> collateralRowsByPool = req.getCollaterals().stream()
                .collect(Collectors.groupingBy(TrialCollateralRowReq::getCollateralPoolCode));

        List<AssetInput> assets = req.getLoans().stream()
                .map(loan -> mapAsset(loan, facilityByCd.get(loan.getFacilityCd()), ratingByCif.get(loan.getCustomerNo()),
                        schedulesByLoan.getOrDefault(loan.getId(), List.of()), req.getHistoricalStages(), calcDate))
                .toList();

        CustomerContext customer = new CustomerContext();
        customer.setCustomerId(assets.get(0).getCustomerNo());
        customer.setAssets(assets);
        ctx.setCustomers(List.of(customer));
        ctx.setFacilities(req.getFacilities().stream().map(this::mapFacility).toList());
        ctx.setCollateralsByPool(collateralRowsByPool.entrySet().stream()
                .collect(Collectors.toMap(Map.Entry::getKey, e -> e.getValue().stream().map(this::mapCollateral).toList())));
        return ctx;
    }
}
```

Add private `mapAsset`, `mapFacility`, `mapCollateral`, and `mapSchedule` methods with direct field mapping.

- [ ] **Step 4: Modify `TrialCalculationService`**

Inject `TrialSourceAssembler`. In `runTrial`, if `req.getLoans()` is not empty, build `JobContext` with assembler; keep legacy fallback for existing clients until frontend is migrated.

- [ ] **Step 5: Run assembler tests**

Run:

```bash
cd ecl-system && mvn -pl ecl-calculation -Dtest=TrialSourceAssemblerTest test
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add ecl-system/ecl-calculation/src/main/java/com/bank/ecl/calculation/trial ecl-system/ecl-calculation/src/test/java/com/bank/ecl/calculation/trial/TrialSourceAssemblerTest.java
git commit -m "feat: assemble trial source rows into engine context"
```

---

### Task 5: Align Parameter Schema and DTOs

**Files:**
- Create: `ecl-system/ecl-data/src/main/resources/db/changelog/012-engine-alignment-fields.sql`
- Modify: `db.changelog-master.xml`
- Modify entities and parameter DTOs for risk group, stage, PD, scheme.
- Tests: existing parameter service tests if present; otherwise compile with Maven.

- [ ] **Step 1: Add migration**

Create SQL:

```sql
--liquibase formatted sql
--changeset ecl:012
ALTER TABLE tbl_risk_group_detail
    DROP COLUMN customer_type,
    DROP COLUMN region_code;

ALTER TABLE tbl_crr_rating_drop_rule
    ADD COLUMN rating_system VARCHAR(32) NOT NULL DEFAULT 'INTERNAL_CRR' AFTER group_id,
    ADD COLUMN rating_agency VARCHAR(64) NOT NULL DEFAULT 'INTERNAL_CRR' AFTER rating_system,
    DROP INDEX uk_drop_rule,
    ADD UNIQUE KEY uk_drop_rule (scheme_id, group_id, rating_system, rating_agency, current_rating);

ALTER TABLE tbl_pd_curve
    ADD COLUMN rating_system VARCHAR(32) NOT NULL DEFAULT 'INTERNAL_CRR' AFTER scenario_id,
    ADD COLUMN rating_agency VARCHAR(64) NOT NULL DEFAULT 'INTERNAL_CRR' AFTER rating_system,
    DROP INDEX uk_pd_curve,
    ADD UNIQUE KEY uk_pd_curve (scheme_id, group_id, scenario_id, rating_system, rating_agency, rating_code);

ALTER TABLE tbl_ecl_scheme
    ADD COLUMN lgd_floor DECIMAL(5,4) NOT NULL DEFAULT 0.1000 AFTER default_lgd;
```

Add the changelog to `db.changelog-master.xml`.

- [ ] **Step 2: Update entities**

Remove `customerType` and `regionCode` from `RiskGroupDetailEntity`. Add:

```java
private String ratingSystem;
private String ratingAgency;
```

to `CrrRatingDropRuleEntity` and `PdCurveEntity`. Add:

```java
private BigDecimal lgdFloor;
```

to `EclSchemeEntity`.

- [ ] **Step 3: Update parameter DTOs/services**

Update DTOs and copy service so scheme copy preserves new fields:

```java
target.setRatingSystem(source.getRatingSystem());
target.setRatingAgency(source.getRatingAgency());
target.setLgdFloor(source.getLgdFloor());
```

Risk group DTOs must no longer expose `customerType` or `regionCode`.

- [ ] **Step 4: Compile parameter and data modules**

Run:

```bash
cd ecl-system && mvn -pl ecl-data,ecl-parameter -am test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add ecl-system/ecl-data/src/main ecl-system/ecl-parameter/src/main
git commit -m "feat: align parameter schema with engine inputs"
```

---

### Task 6: Risk Group Engine

**Files:**
- Modify: `RiskGroupEngine.java`
- Modify tests: `RiskGroupEngineTest.java`

- [ ] **Step 1: Write failing tests**

Add tests:

```java
@Test
void shouldNotMatchNonBlankRuleWhenAssetValueBlank() {
    RiskGroupDetailEntity rule = detail("GRP_001", 1, "2 Loan", "公司贷款", "制造业", "房产抵押");
    when(detailMapper.selectList(any())).thenReturn(List.of(rule));
    when(groupMapper.selectList(any())).thenReturn(List.of(group("GRP_001", "贷款")));

    AssetInput asset = asset("2 Loan", "公司贷款", null, "房产抵押");
    engine.execute(jobCtx("SCH_001", List.of(asset)));

    assertEquals("GRP_DEFAULT", asset.getGroupId());
}

@Test
void shouldIgnoreCustomerTypeAndRegionCode() {
    RiskGroupDetailEntity rule = detail("GRP_001", 1, "2 Loan", "公司贷款", "制造业", "房产抵押");
    when(detailMapper.selectList(any())).thenReturn(List.of(rule));
    when(groupMapper.selectList(any())).thenReturn(List.of(group("GRP_001", "贷款")));

    AssetInput asset = asset("2 Loan", "公司贷款", "制造业", "房产抵押");
    asset.setCustomerType("不应参与");
    asset.setRegionCode("不应参与");
    engine.execute(jobCtx("SCH_001", List.of(asset)));

    assertEquals("GRP_001", asset.getGroupId());
}
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
cd ecl-system && mvn -pl ecl-engine -Dtest=RiskGroupEngineTest test
```

Expected: at least the blank-source test fails under current code.

- [ ] **Step 3: Implement four-dimension matching**

Change `matchGroup` to:

```java
if (matchDimension(asset.getBusinessLine(), rule.getBusinessLine())
        && matchDimension(asset.getProductType(), rule.getProductType())
        && matchDimension(asset.getIndustryCode(), rule.getIndustryCode())
        && matchDimension(asset.getCollateralType(), rule.getCollateralType())) {
    return rule.getGroupId();
}
```

Change `matchDimension` to:

```java
if (ruleValue == null || ruleValue.isBlank()) {
    return true;
}
if (assetValue == null || assetValue.isBlank()) {
    return false;
}
return ruleValue.equals(assetValue);
```

- [ ] **Step 4: Run tests**

Run:

```bash
cd ecl-system && mvn -pl ecl-engine -Dtest=RiskGroupEngineTest test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add ecl-system/ecl-engine/src/main/java/com/bank/ecl/engine/riskgroup/RiskGroupEngine.java ecl-system/ecl-engine/src/test/java/com/bank/ecl/engine/riskgroup/RiskGroupEngineTest.java
git commit -m "feat: align risk group matching rules"
```

---

### Task 7: Stage Engine

**Files:**
- Modify: `StageEngine.java`
- Modify: `StageConditionEvaluator.java`
- Modify: `StageResult.java`
- Modify tests: `StageEngineTest.java`

- [ ] **Step 1: Write failing tests**

Add tests for:

```java
@Test
void shouldUseIsNplForStage3DefaultRule() {
    StageRuleEntity rule = forwardRule("GRP_001", 1, "STAGE_3", "{\"is_npl\":\"Y\"}");
    when(stageRuleMapper.selectList(any())).thenReturn(List.of(rule));
    when(crrDropRuleMapper.selectList(any())).thenReturn(List.of());

    AssetInput asset = asset("GRP_001", Stage.STAGE_1);
    asset.setIsNpl("Y");

    engine.execute(jobCtx("SCH_001", List.of(asset)));

    assertEquals(Stage.STAGE_3, asset.getStageResult().getStage());
}

@Test
void shouldBlockStage3DirectRollbackToStage1() {
    StageRuleEntity rollback = rollbackRule("GRP_001", "STAGE_3", "STAGE_1", "{\"normal_consecutive_days\":{\"min\":180}}");
    when(stageRuleMapper.selectList(any())).thenReturn(List.of(rollback));
    when(crrDropRuleMapper.selectList(any())).thenReturn(List.of());

    AssetInput asset = asset("GRP_001", Stage.STAGE_3);
    asset.setNormalConsecutiveDays(365);

    engine.execute(jobCtx("SCH_001", List.of(asset)));

    assertEquals(Stage.STAGE_3, asset.getStageResult().getStage());
    assertEquals("ROLLBACK_BLOCKED", asset.getStageResult().getTriggerType());
}
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
cd ecl-system && mvn -pl ecl-engine -Dtest=StageEngineTest test
```

Expected: failure because `is_npl` and direct Stage3 rollback logic are not supported.

- [ ] **Step 3: Add rating agency-aware CRR map**

Build key:

```java
private String ratingDropKey(String groupId, String ratingSystem, String ratingAgency, String currentRating) {
    return String.join("|", nvl(groupId), nvl(ratingSystem), nvl(ratingAgency), nvl(currentRating));
}
```

For internal CRR use `ratingSystem = INTERNAL_CRR` and `ratingAgency = INTERNAL_CRR`.

- [ ] **Step 4: Update condition evaluator**

Support JSON `or` and `and` arrays as well as object maps. Field lookup already converts snake case to camel case, so adding `isNpl`, `normalConsecutiveDays`, `otherRiskInfo`, and rating fields on `AssetInput` makes conditions resolvable.

- [ ] **Step 5: Add direct rollback guard**

Before evaluating rollback rules:

```java
if (lastStage == Stage.STAGE_3 && targetStage == Stage.STAGE_1) {
    return new StageResult(Stage.STAGE_3, "ROLLBACK_BLOCKED", true);
}
```

- [ ] **Step 6: Run tests**

Run:

```bash
cd ecl-system && mvn -pl ecl-engine -Dtest=StageEngineTest test
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add ecl-system/ecl-engine/src/main/java/com/bank/ecl/engine/stage ecl-system/ecl-engine/src/test/java/com/bank/ecl/engine/stage/StageEngineTest.java
git commit -m "feat: align stage engine with rating agency rules"
```

---

### Task 8: PD Engine

**Files:**
- Modify: `PdEngine.java`
- Modify: `PdDetail.java` or replace with `PdScenarioResult`
- Modify tests: `PdEngineTest.java`

- [ ] **Step 1: Write failing tests**

Add:

```java
@Test
void shouldUseExternalRatingAgencyForExternalGroup() {
    AssetInput asset = asset("GRP_003", null, Stage.STAGE_1);
    asset.setExtRatingThisYear("A1");
    asset.setExtRatingCoThisYear("MOODY");

    PdCurveEntity curve = curve("GRP_003", "INTERNATIONAL_EXTERNAL", "MOODY", "A1", 1L, 0.02);
    when(scenarioMapper.selectList(any())).thenReturn(List.of(scenario(1L, "BASE", "基准", 1.0)));
    when(curveMapper.selectList(any())).thenReturn(List.of(curve));

    engine.execute(ctx("SCH_001", asset));

    assertNull(asset.getPdException());
    assertEquals(0.02, asset.getPdScenarioResults().get(0).getPdValue(), 0.0001);
}

@Test
void shouldBlockWhenMaturityDateMissing() {
    AssetInput asset = asset("GRP_001", "CRR5", Stage.STAGE_1);
    asset.setMaturityDate(null);

    engine.execute(ctx("SCH_001", asset));

    assertEquals("ECL_001", asset.getPdException());
}
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
cd ecl-system && mvn -pl ecl-engine -Dtest=PdEngineTest test
```

Expected: failure because rating agency and maturity blocking are not implemented.

- [ ] **Step 3: Implement rating-source resolver**

Use:

```java
if (Set.of("GRP_003", "GRP_004").contains(groupId)) {
    return new RatingSelection("INTERNATIONAL_EXTERNAL", asset.getExtRatingCoThisYear(), asset.getExtRatingThisYear());
}
return new RatingSelection("INTERNAL_CRR", "INTERNAL_CRR", asset.getCrrFinal());
```

- [ ] **Step 4: Implement curve cache key**

```java
c.getGroupId() + "|" + c.getScenarioId() + "|" + c.getRatingSystem() + "|" + c.getRatingAgency() + "|" + c.getRatingCode()
```

- [ ] **Step 5: Move weighting out of PD**

Set scenario details with raw `pdValue` and scenario weight. Do not compute final weighted ECL in this engine.

- [ ] **Step 6: Stage3 handling**

After maturity validation, if stage is `STAGE_3`, create one scenario result per scenario with `pdValue = 1.0`.

- [ ] **Step 7: Run tests**

Run:

```bash
cd ecl-system && mvn -pl ecl-engine -Dtest=PdEngineTest test
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add ecl-system/ecl-engine/src/main/java/com/bank/ecl/engine/pd ecl-system/ecl-engine/src/main/java/com/bank/ecl/engine/core ecl-system/ecl-engine/src/test/java/com/bank/ecl/engine/pd/PdEngineTest.java
git commit -m "feat: align pd engine with rating source selection"
```

---

### Task 9: EAD Engine

**Files:**
- Modify: `EadEngine.java`
- Modify tests: `EadEngineTest.java`

- [ ] **Step 1: Write failing tests**

Add tests for:

```java
@Test
void shouldDiscountOnlyFutureRepaymentPeriods() {
    AssetInput asset = assetWithSchedule("LN_001", "FAC_001");
    asset.setCalcDate(LocalDate.of(2026, 6, 24));
    asset.setRepaymentSchedules(List.of(
            schedule(LocalDate.of(2026, 1, 1), 100, 10),
            schedule(LocalDate.of(2027, 1, 1), 100, 10)
    ));

    engine.execute(ctxWithFacility(asset));

    assertTrue(asset.getOnBsEad() > 0);
    assertTrue(asset.getEadBreakdown().contains("futurePeriods=1"));
}

@Test
void shouldAllocateFacilityUndrawnAmountByAmtFinancedShare() {
    AssetInput a1 = asset("LN_001", "FAC_001", 600);
    AssetInput a2 = asset("LN_002", "FAC_001", 400);
    JobContext ctx = ctxWithFacility(a1, a2);

    engine.execute(ctx);

    assertEquals(60.0, a1.getOffBsEad(), 0.01);
    assertEquals(40.0, a2.getOffBsEad(), 0.01);
}
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
cd ecl-system && mvn -pl ecl-engine -Dtest=EadEngineTest test
```

Expected: failure because current engine does not use schedules or facility allocation.

- [ ] **Step 3: Implement CCF key with days**

Match CCF by `productType + commitmentType` and `commitmentDaysMin <= commitmentDays <= commitmentDaysMax`.

- [ ] **Step 4: Implement on-balance paths**

If repayment schedules exist, sum only `dueDate > calcDate` discounted by `ctx.discountRate`. If not, use `loanBalCny + intAccruedCny`.

- [ ] **Step 5: Implement off-balance path**

For each facility, compute:

```java
undrawn = firstNonNull(facility.undrawnAmtCny, facility.limitAmtCny.subtract(facility.usedLimit));
offBsPool = max(0, undrawn) * ccf;
assetShare = asset.amtFinancedCny / sumAmtFinancedCnyForFacility;
asset.offBsEad = offBsPool * assetShare;
```

- [ ] **Step 6: Run tests**

Run:

```bash
cd ecl-system && mvn -pl ecl-engine -Dtest=EadEngineTest test
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add ecl-system/ecl-engine/src/main/java/com/bank/ecl/engine/ead/EadEngine.java ecl-system/ecl-engine/src/test/java/com/bank/ecl/engine/ead/EadEngineTest.java
git commit -m "feat: calculate ead from schedules and facilities"
```

---

### Task 10: LGD Engine

**Files:**
- Modify: `LgdEngine.java`
- Modify tests: `LgdEngineTest.java`

- [ ] **Step 1: Write failing pool-level LGD test**

Add:

```java
@Test
void shouldCalculatePoolLgdFromCollateralNetValueAndPoolEad() {
    AssetInput asset = asset("GRP_001", "房产抵押", "公司贷款");
    asset.setCollateralPoolId("POOL_001");
    asset.setTotalEad(1000.0);

    JobContext ctx = ctx("SCH_001", 0.45, asset);
    ctx.setLgdFloor(0.10);
    ctx.setCollateralsByPool(Map.of("POOL_001", List.of(collateral("房产", "住宅", 800.0))));

    when(lgdCurveMapper.selectList(any())).thenReturn(List.of(curve("GRP_001", "房产抵押", "公司贷款", 0.45)));
    when(discountMapper.selectList(any())).thenReturn(List.of(discount("房产", "住宅", 0.20)));
    when(depreciationMapper.selectList(any())).thenReturn(List.of(depreciation("住宅", 0, 0.0)));

    engine.execute(ctx);

    assertEquals(0.17, asset.getLgdValue(), 0.01);
}
```

- [ ] **Step 2: Run test and verify failure**

Run:

```bash
cd ecl-system && mvn -pl ecl-engine -Dtest=LgdEngineTest test
```

Expected: failure because pool-level LGD is not implemented.

- [ ] **Step 3: Inject discount and depreciation mappers**

Add constructor dependencies:

```java
private final LgdCollateralDiscountMapper discountMapper;
private final LgdDepreciationMapper depreciationMapper;
```

- [ ] **Step 4: Implement pool aggregation**

Group assets by `collateralPoolId`. For each pool:

```java
eadTotal = sum(asset.totalEad);
collateralNetValue = sum(appraisalValue * (1 + depreciationRate) * (1 - discountRate));
eadCovered = min(collateralNetValue, eadTotal);
eadUncovered = eadTotal - eadCovered;
lgdPool = (eadUncovered * lgdUncovered + eadCovered * ctx.lgdFloor) / eadTotal;
```

Assign `lgdPool` to every asset in the pool.

- [ ] **Step 5: Run tests**

Run:

```bash
cd ecl-system && mvn -pl ecl-engine -Dtest=LgdEngineTest test
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add ecl-system/ecl-engine/src/main/java/com/bank/ecl/engine/lgd/LgdEngine.java ecl-system/ecl-engine/src/test/java/com/bank/ecl/engine/lgd/LgdEngineTest.java
git commit -m "feat: calculate lgd by collateral pool"
```

---

### Task 11: ECL, Overlay, and Output

**Files:**
- Modify: `EclCalcEngine.java`
- Modify: `OverlayEngine.java`
- Modify: `OutputEngine.java`
- Modify tests: `EclCalcEngineTest.java`, `OverlayEngineTest.java`, `OutputEngineTest.java`

- [ ] **Step 1: Write failing ECL scenario test**

Add:

```java
@Test
void shouldCalculateWeightedEclFromPdScenarios() {
    AssetInput asset = asset(0.0, 0.45, 1000.0);
    asset.setPdScenarioResults(List.of(
            new PdScenarioResult("BASE", "基准", BigDecimal.valueOf(0.6), 0.02),
            new PdScenarioResult("PESS", "悲观", BigDecimal.valueOf(0.4), 0.05)
    ));

    engine.execute(ctx(asset));

    assertEquals(14.4, asset.getEclValue(), 0.01);
    assertEquals(2, asset.getEclScenarioResults().size());
}
```

- [ ] **Step 2: Write failing Overlay tie-break test**

Add:

```java
@Test
void shouldUseLowestPriorityWhenEquivalentRatioTies() {
    OverlayRuleEntity r1 = rule("GRP_001", "PERCENTAGE", 0.01, 2, null);
    OverlayRuleEntity r2 = rule("GRP_001", "PERCENTAGE", 0.01, 1, null);
    when(overlayRuleMapper.selectList(any())).thenReturn(List.of(r1, r2));

    AssetInput asset = asset("GRP_001", 100.0, 1000.0);
    engine.execute(ctx("SCH_001", LocalDate.of(2026, 6, 24), asset));

    assertEquals(r2.getRuleId(), asset.getSelectedOverlayId());
}
```

- [ ] **Step 3: Run tests and verify failure**

Run:

```bash
cd ecl-system && mvn -pl ecl-engine -Dtest=EclCalcEngineTest,OverlayEngineTest,OutputEngineTest test
```

Expected: failure because scenario ECL and overlay tie-break are not implemented.

- [ ] **Step 4: Implement ECL scenario weighting**

For each `PdScenarioResult`:

```java
scenarioEcl = pdValue * asset.getLgdValue() * asset.getTotalEad();
weightedEcl = scenarioEcl * weight;
```

Sum weighted ECL into `asset.eclValue`.

- [ ] **Step 5: Implement Overlay date and tie-break**

Skip rules where `effectiveDate > calcDate` or `expiryDate < calcDate`. For FIXED and `ead <= 0`, return `null` equivalent ratio and do not select it. On equal ratio, select lower `priority`.

- [ ] **Step 6: Update Output fields**

Serialize `pdScenarioResults`, `eclScenarioResults`, `eadBreakdown`, and `lgdDetails` to JSON strings. Set `selectedOverlayId`.

- [ ] **Step 7: Run tests**

Run:

```bash
cd ecl-system && mvn -pl ecl-engine -Dtest=EclCalcEngineTest,OverlayEngineTest,OutputEngineTest test
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add ecl-system/ecl-engine/src/main/java/com/bank/ecl/engine/ecl ecl-system/ecl-engine/src/main/java/com/bank/ecl/engine/overlay ecl-system/ecl-engine/src/main/java/com/bank/ecl/engine/output ecl-system/ecl-engine/src/test/java/com/bank/ecl/engine
git commit -m "feat: calculate ecl and overlay from engine details"
```

---

### Task 12: Trial Result Mapping

**Files:**
- Modify: `TrialCalculationService.java`
- Modify DTOs: `AssetResult.java`, `TrialScenarioRowVO.java`, `TrialStepVO.java`
- Test: `TrialCalculationServiceTest.java` if present; otherwise add a focused unit test with mocked dispatcher.

- [ ] **Step 1: Write failing result mapping test**

Add:

```java
@Test
void shouldExposeEadLgdAndScenarioDetailsInTrialSteps() {
    AssetInput asset = new AssetInput();
    asset.setAssetId("LN_001");
    asset.setOnBsEad(800);
    asset.setOffBsEad(100);
    asset.setTotalEad(900);
    asset.setLgdValue(0.2);
    asset.setCollateralPoolId("POOL_001");
    asset.setEclValue(18);
    asset.setEclScenarioResults(List.of(new EclScenarioResult("BASE", BigDecimal.valueOf(0.6), 30, 18)));

    AssetResult result = serviceForTest.buildAssetResult(asset, "SCH_001");

    assertTrue(result.getSteps().stream().anyMatch(s -> s.getKey().equals("ead")));
    assertTrue(result.getSteps().stream().anyMatch(s -> s.getKey().equals("lgd")));
    assertTrue(result.getSteps().stream().anyMatch(s -> s.getKey().equals("ecl")));
}
```

- [ ] **Step 2: Run test and verify failure**

Run:

```bash
cd ecl-system && mvn -pl ecl-calculation -Dtest=TrialCalculationServiceTest test
```

Expected: failure until result mapping exposes new details.

- [ ] **Step 3: Update result builders**

Add metrics:

```java
metric("表内 EAD", formatMoney(a.getOnBsEad()));
metric("表外 EAD", formatMoney(a.getOffBsEad()));
metric("押品池", nvl(a.getCollateralPoolId()));
metric("LGD", formatPercent(a.getLgdValue()));
metric("ECL 加权", formatMoney(a.getEclValue()));
```

PD rows should use `PdScenarioResult`. ECL rows should use `EclScenarioResult`.

- [ ] **Step 4: Run calculation tests**

Run:

```bash
cd ecl-system && mvn -pl ecl-calculation test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add ecl-system/ecl-calculation/src/main/java/com/bank/ecl/calculation/trial ecl-system/ecl-calculation/src/test/java/com/bank/ecl/calculation/trial
git commit -m "feat: expose detailed trial engine results"
```

---

### Task 13: Frontend Trial Center Source Tables

**Files:**
- Modify: `ecl-system/ecl-frontend/src/api/trial.ts`
- Modify: `ecl-system/ecl-frontend/src/pages/trial/TrialCenter.tsx`
- Modify: `ecl-system/ecl-frontend/src/pages/trial/TrialCenter.css`

- [ ] **Step 1: Update TypeScript API types**

Replace internal `AssetInputReq` submission with:

```ts
export interface TrialLoanRowReq {
  id: string;
  facilityCd?: string;
  customerNo?: string;
  customerName?: string;
  industryCn?: string;
  segment?: string;
  productType?: string;
  currencyCd?: string;
  amtFinancedCny?: number;
  loanBalCny?: number;
  intAccruedCny?: number;
  interestRate?: number;
  loanStartDt?: string;
  loanMaturityDt?: string;
  overdueDays?: number;
  isNpl?: string;
  guaranteeType?: string;
  normalConsecutiveDays?: number;
  otherRiskInfo?: string;
  businessType?: string;
  overduePrincipal?: number;
  overdueInterest?: number;
}
```

Add matching interfaces for facility, repayment, collateral, rating, and historical stage rows.

- [ ] **Step 2: Refactor page state**

Use:

```ts
const [loans, setLoans] = useState<TrialLoanRowReq[]>([makeDefaultLoan()]);
const [facilities, setFacilities] = useState<TrialFacilityRowReq[]>([makeDefaultFacility()]);
const [repaymentSchedules, setRepaymentSchedules] = useState<TrialRepaymentRowReq[]>([]);
const [collaterals, setCollaterals] = useState<TrialCollateralRowReq[]>([makeDefaultCollateral()]);
const [ratings, setRatings] = useState<TrialRatingRowReq[]>([makeDefaultRating()]);
const [historicalStages, setHistoricalStages] = useState<TrialHistoricalStageRowReq[]>([]);
```

- [ ] **Step 3: Replace asset collapses with source table sections**

Keep the existing `Panel` and `Collapse` style. Add one compact editable section per source table. Use current `Input`, `InputNumber`, `DatePicker`, `Select`, and `Button` patterns.

- [ ] **Step 4: Update submit payload**

Submit:

```ts
trialApi.runTrial({
  schemeId: selectedSchemeId,
  assetId: loans[0]?.id || 'TRIAL_AST',
  calcDate: calcDate.format('YYYY-MM-DD'),
  scope,
  loans,
  facilities,
  repaymentSchedules,
  collaterals,
  ratings,
  historicalStages,
});
```

- [ ] **Step 5: Update presets**

Make presets populate coherent rows:

- one loan `LN_001`
- one facility `FAC_001` with `collateralPoolId = POOL_001`
- one rating row for `CUST_001`
- one collateral row for `POOL_001`
- optional repayment schedules for `LN_001`

- [ ] **Step 6: Run frontend build**

Run:

```bash
cd ecl-system/ecl-frontend
npm run build
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add ecl-system/ecl-frontend/src/api/trial.ts ecl-system/ecl-frontend/src/pages/trial/TrialCenter.tsx ecl-system/ecl-frontend/src/pages/trial/TrialCenter.css
git commit -m "feat: enter source tables in trial center"
```

---

### Task 14: Parameter Frontend Field Adaptation

**Files:**
- Modify: `RiskGroupConfig.tsx`
- Modify: `StageConfig.tsx`
- Modify: `PdConfig.tsx`
- Modify scheme page that edits `EclSchemeEntity`
- Modify: `LgdConfig.tsx`
- Modify: `CcfConfig.tsx`
- Modify related API types under `ecl-system/ecl-frontend/src/api`

- [ ] **Step 1: Risk group page**

Remove customer type and region code columns/inputs. Keep existing table/add/edit flow. Confirm columns include business line, product type, industry code, collateral type, priority, group.

- [ ] **Step 2: Stage page**

Add `ratingSystem` and `ratingAgency` fields to CRR downgrade rule table/editor. Keep current rule JSON editing interaction.

- [ ] **Step 3: PD page**

Add `ratingSystem` and `ratingAgency` to curve request/response types and grid columns. Keep current matrix editing interaction.

- [ ] **Step 4: Scheme page**

Expose `lgdFloor` next to `defaultLgd`. Do not change scheme navigation or overview layout.

- [ ] **Step 5: LGD and CCF pages**

Ensure LGD discount page shows `collateralCategory`, `collateralType`, `discountRate`. Ensure depreciation page shows `collateralType`, `yearOffset`, `depreciationRate`. Ensure CCF page shows commitment day min/max.

- [ ] **Step 6: Run frontend build**

Run:

```bash
cd ecl-system/ecl-frontend
npm run build
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add ecl-system/ecl-frontend/src/api ecl-system/ecl-frontend/src/pages/parameter ecl-system/ecl-frontend/src/pages/scheme
git commit -m "feat: align parameter pages with engine fields"
```

---

### Task 15: Full Verification

**Files:**
- No new files unless fixes are needed.

- [ ] **Step 1: Run backend tests**

Run:

```bash
cd ecl-system && mvn test
```

Expected: PASS.

- [ ] **Step 2: Run frontend build**

Run:

```bash
cd ecl-system/ecl-frontend
npm run build
```

Expected: PASS.

- [ ] **Step 3: Check git diff**

Run:

```bash
git status --short
git diff --check
```

Expected: only intentional uncommitted files remain; `git diff --check` has no whitespace errors.

- [ ] **Step 4: Manual trial smoke test**

Start backend and frontend using existing project commands. In trial center, load preset, run trial, and verify:

- request contains source-table arrays
- result contains at least one asset row
- expandable steps show risk group, stage, PD, EAD, LGD, ECL, overlay
- exceptions are displayed when required parameter curves are missing

- [ ] **Step 5: Final commit if smoke fixes were needed**

```bash
git add <changed-files>
git commit -m "fix: complete trial source input verification"
```

---

## Self-Review

Spec coverage:

- Trial center source-table entry is covered by Tasks 2, 4, 12, and 13.
- Parameter layer field changes with minimal UI interaction changes are covered by Tasks 5 and 14.
- Engine behavior changes are covered by Tasks 6 through 11.
- Result display changes are covered by Tasks 12 and 13.
- Formal batch ingestion remains out of scope.

Placeholder scan:

- The plan intentionally avoids open-ended placeholder markers.
- Mechanical field mapping is constrained to explicitly listed source row fields and engine context fields.

Type consistency:

- DTO names use `Trial*RowReq`.
- Engine context additions use `FacilityInput`, `RepaymentScheduleInput`, `CollateralInput`, `PdScenarioResult`, and `EclScenarioResult`.
- Frontend request arrays use `loans`, `facilities`, `repaymentSchedules`, `collaterals`, `ratings`, and `historicalStages`, matching backend request fields.

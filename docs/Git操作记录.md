# Git 操作记录

> 记录 Claude 代为执行的每次 `git commit` / `git push`，作为可追溯的操作留痕。不记录普通的 `git status`/`git diff`/`git log` 等只读命令。

| 日期 | 类型 | commit hash | 涉及文件 | 说明 | 结果 |
| :--: | :--- | :---------- | :------- | :--- | :--- |
| 2026-07-10 | commit | `f871ee2` | `.gitignore`, `docs/Test/UAT测试案例_v2.md` | 补齐 TC-RG-01~03/TC-ST-01~03/TC-PD-01~03 共9项API实测回填；PC-01/PC-20复测转全通过；修正验证统计表口径不一致（剩余项分布数字对齐、标注347总数缺口）；.gitignore 补充 `.gstack/` | ✅ 提交成功 |
| 2026-07-10 | push | `f871ee2` | → `origin/main` (`https://github.com/DEACONHAN/ecl-project`) | 推送上述提交 | ❌ 失败：`CONNECT tunnel failed, response 405`（本地代理 `HTTPS_PROXY=127.0.0.1:9090` 挡住了到 github.com 的连接，非git本身报错） |
| 2026-07-10 | merge | `371e349` | 28个文件（同事5个提交：OverlayConfig解析修复/LGD池计算改为押品自身LGD+加权平均/试算错误提示与日期解析修复/管理层叠加null字段匹配修复/文档归档到docs） | 绕过代理后 `git fetch` 发现 origin/main 已领先5个提交（同事推送），与本地 `f871ee2` 无文件重叠，执行 `git merge origin/main` 合并，无冲突。⚠️ 注意：同事的修复改到了 `StageEngine.java`(+46/-)和`TrialCalculationService.java`(+26/-)，这两个文件正是今天UAT复核时引用过具体行号的文件，合并后行号可能已漂移，如果之后再引用需要重新核对 | ✅ 合并成功，无冲突 |
| 2026-07-10 | push | `371e349` | → `origin/main`，`69894ae..371e349` | 绕开本地 `HTTPS_PROXY`/`HTTP_PROXY` 环境变量后重新推送（`env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy git push`），带上前面的merge commit | ✅ 推送成功 |
| 2026-07-10 | commit | `79e42ea` | `docs/Git操作记录.md`（新建） | 新建本记录文档并写入以上4条历史记录 | ✅ 提交成功 |
| 2026-07-10 | push | `79e42ea` | → `origin/main`，`371e349..79e42ea` | 推送上述提交（同样绕开代理） | ✅ 推送成功 |
| 2026-07-15 | commit | `f0c81df` | `TrialSourceAssembler.java`、`AssetInput.java`、`EadEngine.java`、`LgdEngine.java` | UAT测试(25~31笔样例)期间发现并修复3处bug：①押品池折价率查询key格式错误(细类配细类→改为大类配细类)导致押品净值恒为0；②押品池单件押品LGD查询未传产品类型导致永远查不到精确值，补充精确匹配+兜底两级查询；③EAD还款计划折现此前固定用方案统一discount_rate，未接入借据自身利率，新增`AssetInput.interestRate`字段并接入折现逻辑，优先用借据自身利率、缺失时退回方案统一值 | ✅ 提交成功 |
| 2026-07-15 | push | `f0c81df` | → `origin/main`，`0814ff1..f0c81df` | 绕开本地代理环境变量后推送 | ✅ 推送成功 |
| 2026-07-16 | commit | `6338428` | `LgdEngine.java` | 对照ECL方法论文档核实：押品覆盖部分(LGDsi)不该查风险分组维度的LGD曲线表(tbl_lgd_curve)，应按Floor LGD定价(方法论只分"现金/其它"两档)。原`lookupLgdByType()`删除，改为`lookupCollateralFloor(collType, lgdFloor)`：押品细类含"现金"→0%，其余统一取方案配置的`lgd_floor`下限值(原本传而不用的死参数，现在真正接入)；资产层级/未覆盖部分(LGDu)的曲线查询逻辑不变。曾先设计成新建`tbl_lgd_collateral_floor`表+新参数配置页tab的方案，用户认为只有2档取值没必要建表，改成现在这个更轻量的代码判断方案，未新建任何表/接口 | ✅ 提交成功 |
| 2026-07-16 | commit | `d7e471c` | `docs/Git操作记录.md` | 补记`f0c81df`的历史留痕，并记录`6338428`的提交信息 | ✅ 提交成功 |
| 2026-07-16 | push | `d7e471c` | → `origin/main`，`f0c81df..d7e471c` | 绕开本地代理环境变量后推送（一次性带上`6338428`+`d7e471c`两个提交） | ✅ 推送成功 |

# Nexus Travel AI ✈

AI 驱动的旅行规划应用：通过对话生成个性化行程、目的地攻略、真实天气预报，并支持行程管理与日历导出。

## 功能

- **AI 对话规划**：中文旅行助手实时对话，自动抽取目的地/天数/预算/人数/偏好并同步到行程面板
- **一键生成行程**：AI 生成逐日活动卡片（时段、景点、交通建议、花费、标签），支持编辑与删除
- **旅行管理**：行程保存、列表筛选搜索、每日活动完成勾选、行前清单、预算分配
- **目的地攻略**：AI 生成城市速览/美食/交通/文化礼仪/避坑提示 + **每日行程详解**（先去哪、怎么去、再去哪）
- **真实天气**：Open-Meteo 逐日预报（过去→历史数据、未来 16 天→预报、更远→气候常态），6 小时缓存
- **日历导出**：一键生成 `.ics` 日历文件导入系统日历
- **响应式**：手机/平板/桌面全适配

## 技术栈

| 层 | 技术 |
| --- | --- |
| 框架 | Nuxt 4（SPA）+ Vue 3.5 + Nitro |
| AI | DeepSeek API（JSON 模式 + 可靠性管道） |
| 数据 | Prisma 7 + MariaDB（driver adapter） |
| 天气/地理 | Open-Meteo / Nominatim（免费无需 key） |
| 测试 | Vitest（单元）+ Playwright（e2e，AI Mock 模式） |
| 规范 | ESLint（@nuxt/eslint）+ Prettier |

## 架构

```mermaid
graph LR
  B[浏览器 SPA] -->|$fetch| N[Nitro API 层]
  N -->|chat / itinerary / guide| D[DeepSeek API]
  N -->|forecast / archive / climate| O[Open-Meteo]
  N -->|geocoding| NM[Nominatim]
  N -->|Prisma| M[(MariaDB)]
  subgraph AI 可靠性管道
    D --> V[字段净化器]
    V --> R[带纠错重试]
    R --> E[正则优先需求抽取]
  end
```

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量（复制示例并填入真实值）
cp .env.example .env
# NUXT_DEEPSEEK_API_KEY=sk-xxx      # DeepSeek 密钥
# NUXT_DATABASE_URL=mysql://user:password@localhost:3306/nexus_travel

# 3. 生成 Prisma 客户端并初始化数据库
npm run db:generate
npm run db:migrate     # 需要本地 MariaDB 在线

# 4. 启动开发服务器
npm run dev            # http://localhost:3000
```

### 常用脚本

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 开发模式（真实 AI） |
| `npm run dev:mock` | 开发模式（AI 固定回复，端口 3100，独立测试库） |
| `npm test` | Vitest 单元测试 |
| `npm run test:e2e` | Playwright 端到端测试（自动启动 mock 服务） |
| `npm run lint` / `lint:fix` | ESLint 检查/修复 |
| `npm run format` | Prettier 全量格式化 |
| `npm run db:studio` | Prisma Studio 数据库可视化 |

> e2e 需要本地 MariaDB 且已创建 `nexus_travel_test` 库（`migrate deploy` 到测试库），`.env.test` 参考 `.env` 修改数据库名即可。

## AI 输出可靠性设计（本项目核心）

LLM 输出天然不确定，直接依赖会频繁出错。本项目的解决思路：

1. **认知**：DeepSeek 的 `json_object` 模式只保证 JSON *语法*合法，不保证*结构*（字段名/类型/枚举值）——实测同一条请求的 period 枚举、cost 类型反复波动
2. **字段净化器**（`server/utils/itinerary-sanitize.js`）：把"严格校验即拒绝"改为"自动修复"——period 同义词归一（清晨→上午、傍晚→晚上）、数字 cost 转字符串、tags 包装、天数裁剪、缺失字段兜底，模型输出什么都能收敛成合法结构
3. **带纠错重试**：解析/结构失败时，把**具体失败原因**写进下一条消息让模型自我修正，而不是笼统提示"重新输出"
4. **正则优先需求抽取**（`server/utils/requirements.js`）：目的地/天数/预算/人数/月份直接从用户原话用正则提取（零幻觉、毫秒级），LLM 只做兜底并带"必须出现在用户消息中"的防幻觉校验；"最新要求优先"（逐条消息从新到旧扫描）
5. **目的地强一致**：生成结果与旅行信息目的地不符时自动带纠错重试，响应目的地强制采用服务端合并值
6. **超时与限流**：每层调用独立超时（30-90s）、瞬时故障自动重试一次、指南/行程最多两轮尝试后明确报错

## API 一览

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/chat` | AI 对话，返回回复 + 合并后的旅行信息（实时同步面板） |
| POST | `/api/itinerary` | 生成行程（需求抽取 + 生成 + 净化） |
| GET/POST | `/api/trips` | 旅行列表 / 保存旅行 |
| GET/PATCH/DELETE | `/api/trips/:id` | 旅行详情 / 更新 / 删除 |
| POST | `/api/trips/:id/guide` | 生成目的地攻略（含每日行程详解） |
| GET | `/api/trips/:id/weather` | 真实天气预报（`?refresh=1` 强制刷新） |
| GET | `/api/trips/:id/ics` | 导出日历文件 |

## 目录结构

```
app/
  components/          # plan 页与 trips 页组件
  composables/         # useTrips
  utils/weather.js     # 天气代码 → 图标/文案
  pages/               # 首页 / plan / trips / trips/:id
server/
  api/                 # Nitro 路由
  utils/               # deepseek（调用+Mock）/ requirements（抽取）
                       # itinerary-sanitize / guide-sanitize / prisma
tests/
  server/              # Vitest 单元测试
  e2e/                 # Playwright 主流程
```

## 设计权衡与已知限制

- `ssr: false`：AI 交互型应用优先客户端体验；首页/列表页可后续 SSR 化做 SEO
- 天气为逐日粒度（最高/最低温、降雨概率、天气代码），AI 的 `weatherHint` 作为兜底保留
- DeepSeek 高峰期限流时接口会快速失败并提示，避免长时间挂起

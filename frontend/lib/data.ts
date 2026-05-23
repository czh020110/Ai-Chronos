import { AIEvent } from "./types";

export const sampleEvents: AIEvent[] = [
  {
    id: "evt-001",
    title: "AlexNet 赢得 ImageNet 竞赛，深度学习革命开启",
    event_date: "2012-09-30",
    content_md: `
## 概述

**AlexNet** 由 Alex Krizhevsky、Ilya Sutskever 和 Geoffrey Hinton 设计，在 2012 年 ImageNet Large Scale Visual Recognition Challenge (ILSVRC) 中以压倒性优势夺冠。

## 关键贡献

- 首次在 GPU 上训练大规模卷积神经网络
- 引入 **ReLU** 激活函数解决梯度消失问题
- 使用 **Dropout** 正则化防止过拟合
- Top-5 错误率降至 **15.3%**，远超第二名 (26.2%)

## 影响

标志着深度学习从学术界边缘走向主流，开启了现代 AI 时代。GPU 训练范式沿用至今。
`,
    tags: ["论文", "模型"],
    source_urls: [
      "https://papers.nips.cc/paper/2012/hash/c399862d3b9d6b76c8436e924a68c45b-Abstract.html",
    ],
    impact_score: 98,
    category: "paper",
    status: "published",
  },
  {
    id: "evt-002",
    title: "生成对抗网络 (GAN) 提出",
    event_date: "2014-06-10",
    content_md: `
## 概述

Ian Goodfellow 等人在 NIPS 2014 发表 **Generative Adversarial Nets**，提出了一种全新的生成模型训练框架。

## 核心思想

- **生成器 (Generator)**：从随机噪声生成逼真样本
- **判别器 (Discriminator)**：区分真实样本与生成样本
- 两者通过**极小极大博弈**共同进化

## 影响

- 被誉为"过去 20 年深度学习最酷的想法"（Yann LeCun）
- 催生了图像生成、风格迁移、Deepfake 等大量应用
- 2024 年 GAN 论文引用量突破 **70,000+**
`,
    tags: ["论文"],
    source_urls: ["https://arxiv.org/abs/1406.2661"],
    impact_score: 95,
    category: "paper",
    status: "published",
  },
  {
    id: "evt-003",
    title: "\"Attention Is All You Need\" — Transformer 架构诞生",
    event_date: "2017-06-12",
    content_md: `
## 概述

Google Brain 团队在 NIPS 2017 发表划时代论文，提出完全基于**自注意力机制**的 Transformer 架构，彻底改变了 NLP 和 AI 格局。

## 核心创新

- 抛弃 RNN/LSTM，全注意力机制并行计算
- **Multi-Head Attention** 捕捉不同子空间的特征
- **Positional Encoding** 保留序列位置信息
- 训练速度比 RNN 快 **10-100 倍**

## 深远影响

Transformer 成为后来 GPT、BERT、T5、LLaMA 等所有大语言模型的基石架构。2024 年论文引用超 **120,000 次**。

> "Attention is all you need" — 这八个字永远改变了 AI 的方向。
`,
    tags: ["论文", "模型"],
    source_urls: ["https://arxiv.org/abs/1706.03762"],
    impact_score: 100,
    category: "paper",
    status: "published",
  },
  {
    id: "evt-004",
    title: "BERT: 来自 Transformer 的双向编码器表征",
    event_date: "2018-10-11",
    content_md: `
## 概述

Google AI 发布 **BERT** (Bidirectional Encoder Representations from Transformers)，在 11 项 NLP 基准测试中刷新最高记录。

## 技术要点

- 基于 Transformer **Encoder** 的预训练模型
- **Masked Language Model** + **Next Sentence Prediction** 预训练目标
- 双向上下文建模，超越单向 GPT 和 ELMo
- GLUE 基准提升 **7.7%** 绝对精度

## 影响

开创了 NLP "预训练 + 微调"范式。BERT 系列衍生模型（RoBERTa、ALBERT、DistilBERT）深刻影响了搜索、问答、情感分析等应用。
`,
    tags: ["论文", "模型"],
    source_urls: ["https://arxiv.org/abs/1810.04805"],
    impact_score: 96,
    category: "paper",
    status: "published",
  },
  {
    id: "evt-005",
    title: "GPT-2: 语言模型是無监督多任务学习者",
    event_date: "2019-02-14",
    content_md: `
## 概述

OpenAI 发布 **GPT-2**，一个 15 亿参数的 Transformer 语言模型，展示了大规模语言模型的惊人文本生成能力。

## 特点

- 基于 Transformer **Decoder** 的自回归语言模型
- 在 WebText 数据集（800 万网页）上训练
- 零样本 (Zero-shot) 多任务能力
- 因"太危险"而**分阶段发布**模型权重

## 争议与影响

OpenAI 的分阶段发布策略引发 AI 安全讨论。尽管当初被认为危险，GPT-2 的能力如今看来只是大语言模型革命的序曲。
`,
    tags: ["模型", "新闻"],
    source_urls: ["https://openai.com/research/better-language-models"],
    impact_score: 90,
    category: "model",
    status: "published",
  },
  {
    id: "evt-006",
    title: "GPT-3: 语言模型的一次范式跃迁",
    event_date: "2020-06-11",
    content_md: `
## 概述

OpenAI 发布 **GPT-3**，1750 亿参数的大规模语言模型，展示了**上下文学习 (In-Context Learning)** 的惊人能力。

## 突破

- 175B 参数，比 GPT-2 大 **100 倍**
- 无需微调即可通过 Few-shot Prompt 执行翻译、问答、代码生成等任务
- 催生了 **Prompt Engineering** 新兴领域
- 通过 API 商业化，开创 LLM-as-a-Service 模式

## 里程碑意义

GPT-3 证明了"规模定律" (Scaling Law) 的有效性——更大的模型与数据带来涌现能力，直接推动全球大模型军备竞赛。
`,
    tags: ["模型", "商业"],
    source_urls: ["https://arxiv.org/abs/2005.14165"],
    impact_score: 98,
    category: "model",
    status: "published",
  },
  {
    id: "evt-007",
    title: "DALL·E: 文本到图像的生成革命",
    event_date: "2021-01-05",
    content_md: `
## 概述

OpenAI 发布 **DALL·E**，一个 120 亿参数的 Transformer 模型，能够从自然语言描述直接生成图像。

## 能力

- 基于 VQ-VAE + Autoregressive Transformer
- **零样本文本到图像生成**
- 可控制物体属性、数量、空间关系
- 支持图像编辑和风格迁移

## 后续发展

DALL·E 揭开了 AI 图像生成时代的序幕。后续 DALL·E 2 (2022)、Stable Diffusion (2022)、Midjourney (2022) 将 AI 艺术带入主流。
`,
    tags: ["模型", "工具"],
    source_urls: ["https://openai.com/research/dall-e"],
    impact_score: 88,
    category: "model",
    status: "published",
  },
  {
    id: "evt-008",
    title: "ChatGPT 发布：AI 走入大众生活",
    event_date: "2022-11-30",
    content_md: `
## 概述

OpenAI 发布 **ChatGPT**，一个基于 GPT-3.5 的对话式 AI 助手。它在 **5 天内用户突破 100 万**，两个月内月活达到 **1 亿**，成为史上增长最快的消费应用。

## 技术基础

- 基于 GPT-3.5 的指令微调版本
- **RLHF** (Reinforcement Learning from Human Feedback) 对齐训练
- 支持对话历史的多轮交互

## 历史性影响

- 引发了全球 AI 投资热潮（2023 年 AI 融资超 **$60B**）
- 改变了教育、编程、写作、客服等行业
- 迫使 Google、Meta 等巨头加速 AI 产品化
- 开启了"AI 民主化"元年

> ChatGPT 是 AI 界的 "iPhone 时刻"。
`,
    tags: ["模型", "商业", "新闻"],
    source_urls: ["https://openai.com/blog/chatgpt"],
    impact_score: 100,
    category: "model",
    status: "published",
  },
  {
    id: "evt-009",
    title: "Stable Diffusion: 开源图像生成普及",
    event_date: "2022-08-22",
    content_md: `
## 概述

Stability AI 发布 **Stable Diffusion**，一个开源的文本到图像潜在扩散模型，将 AI 图像生成能力带给全球开发者社区。

## 技术特点

- 基于 **Latent Diffusion Model**，在压缩潜空间去噪
- 仅需 ~**10GB VRAM** 即可运行（消费级 GPU）
- 开源权重 + 宽松许可证
- 社区快速构建了 ControlNet、LoRA 等生态工具

## 社区影响

开源发布引爆了创意工具生态。ControlNet (2023.2)、ComfyUI、Automatic1111 等工具让 AI 图像生成变得触手可及。
`,
    tags: ["模型", "开源", "工具"],
    source_urls: ["https://stability.ai/blog/stable-diffusion-public-release"],
    impact_score: 92,
    category: "model",
    status: "published",
  },
  {
    id: "evt-010",
    title: "LLaMA 开源：大模型民主化浪潮",
    event_date: "2023-02-24",
    content_md: `
## 概述

Meta AI 发布 **LLaMA** (Large Language Model Meta AI) 系列模型，开源了 7B 到 65B 参数规模的高质量基础模型，仅使用公开数据集训练。

## 突破

- 证明小模型 + 更多数据 可超越大模型（LLaMA-13B 在多数基准上超越 GPT-3-175B）
- 完全使用**公开可获取数据**训练（非私有数据）
- 重量级开源，学术研究友好

## 生态引爆

LLaMA 权重泄露后，全球开发者社区迅速建立了微调生态：
- **Alpaca** (Stanford, 2023.3): \$600 微调出类 GPT-3.5 模型
- **Vicuna, Koala, WizardLM, Orca** 等衍生模型井喷
- 催生了开源 LLM 的 "LoRA 微调" 浪潮
`,
    tags: ["模型", "开源"],
    source_urls: ["https://ai.meta.com/blog/large-language-model-llama-meta-ai/"],
    impact_score: 95,
    category: "model",
    status: "published",
  },
  {
    id: "evt-011",
    title: "GPT-4: 多模态大模型的里程碑",
    event_date: "2023-03-14",
    content_md: `
## 概述

OpenAI 发布 **GPT-4**，首个在专业和学术基准上达到人类水平的大语言模型，并具备多模态理解能力。

## 核心能力

- **多模态输入**：可理解图像与文本
- 在律师考试 (BAR) 中超过 **90%** 考生
- 上下文窗口扩展至 8K/32K tokens
- 事实准确性与安全性显著提升
- 引入 **System Message** 系统级指令机制

## 行业影响

GPT-4 成为企业 AI 应用的事实标准。Microsoft Copilot、GitHub Copilot X、Duolingo Max 等产品均基于 GPT-4 构建。"GPT-4 级"成为衡量模型能力的通用尺度。
`,
    tags: ["模型", "商业"],
    source_urls: ["https://openai.com/research/gpt-4"],
    impact_score: 98,
    category: "model",
    status: "published",
  },
  {
    id: "evt-012",
    title: "Claude 3.5 Sonnet: 代码与推理能力新标杆",
    event_date: "2024-06-20",
    content_md: `
## 概述

Anthropic 发布 **Claude 3.5 Sonnet**，在代码生成、推理和多语言任务上创下新纪录，同时保持行业领先的安全标准。

## 亮点

- **HumanEval** 代码生成基准达 **92.0%**
- 支持 **200K token** 上下文窗口
- **Artifacts** 功能：直接在对话界面渲染代码输出
- 速度比 Claude 3 Opus 快 **2 倍**，成本降低 **80%**
- 在 MMLU、GSM8K、MATH 等基准上全面领先

## 意义

标志着"中小模型 + 高质量训练"路线的可行性。

后续 Claude 3.5 Haiku (2024.10) 和 Claude 4 系列继续推进性能边界。
`,
    tags: ["模型", "商业"],
    source_urls: ["https://www.anthropic.com/news/claude-3-5-sonnet"],
    impact_score: 90,
    category: "model",
    status: "published",
  },
  {
    id: "evt-013",
    title: "Sora: AI 视频生成新纪元",
    event_date: "2024-02-15",
    content_md: `
## 概述

OpenAI 发布 **Sora**，一个文本到视频的生成模型，能够生成长达 **60 秒**的高度逼真视频，引起全球震动。

## 技术突破

- 基于 **Diffusion Transformer (DiT)** 架构
- 将视频视为时空 Patch 序列
- 理解物理世界交互（重力、光影、碰撞）
- 支持多种宽高比和分辨率

## 业界影响

Sora 被称为 "视频生成的 GPT-3 时刻"，推动了 Runway、Pika、Kling（可灵）等竞品加速迭代。影视、广告、教育行业迎来 AI 原生内容革命。
`,
    tags: ["模型", "工具"],
    source_urls: ["https://openai.com/research/sora"],
    impact_score: 88,
    category: "model",
    status: "published",
  },
  {
    id: "evt-014",
    title: "DeepSeek-V3: 开源 MoE 模型的性能突破",
    event_date: "2024-12-26",
    content_md: `
## 概述

DeepSeek 发布 **DeepSeek-V3**，一个 671B 参数的混合专家 (MoE) 模型，训练成本仅 \$5.6M，却在多项基准上与 GPT-4o、Claude 3.5 持平。

## 创新

- **Multi-head Latent Attention (MLA)**：大幅降低 KV Cache 内存
- **DeepSeekMoE**：细粒度专家路由，每个 Token 激活 37B 参数
- **FP8 混合精度训练** + 通信优化
- 训练成本 **557 万美元**，仅为同类模型的 1/10

## 开源影响

DeepSeek-V3 和后续 R1 推理模型 (2025.1) 证明：中国团队在有限算力下，通过架构创新同样能达到世界级性能。开源权重彻底改变了全球 AI 竞争格局。
`,
    tags: ["模型", "开源"],
    source_urls: ["https://arxiv.org/abs/2412.19437"],
    impact_score: 94,
    category: "model",
    status: "published",
  },
  {
    id: "evt-015",
    title: "Gemini 2.5 Pro: 谷歌大模型的最强形态",
    event_date: "2025-03-25",
    content_md: `
## 概述

Google DeepMind 发布 **Gemini 2.5 Pro**，一个原生多模态的"思考型"模型，在数学、科学和代码能力上全面领先。

## 特性

- **原生多模态**：无缝处理文本、图像、音频、视频和代码
- **100 万 token** 上下文窗口（实验性 200 万）
- **Thinking Mode**：显式推理链，在 GPQA、AIME 等困难基准上刷新记录
- 深度整合 Google 生态：Search、Maps、YouTube

## 战略意义

Gemini 2.5 Pro 代表着 Google 在 AI 竞赛中的全面反击，将模型能力与生态优势结合，对标 GPT-5 和 Claude 4。
`,
    tags: ["模型", "商业"],
    source_urls: ["https://blog.google/technology/google-deepmind/gemini-model-thinking-updates-march-2025/"],
    impact_score: 87,
    category: "model",
    status: "published",
  },
  {
    id: "evt-016",
    title: "AlphaFold 2: AI 破解蛋白质折叠难题",
    event_date: "2020-11-30",
    content_md: `
## 概述

DeepMind 的 **AlphaFold 2** 在 CASP14 蛋白质结构预测竞赛中以原子级精度夺冠，解决了困扰生物学 50 年的"蛋白质折叠问题"。

## 技术

- 基于 **Evoformer** (进化 Transformer) 架构
- 融合多重序列比对 (MSA) 与结构模板
- 端到端预测 3D 蛋白结构，GDT 中位数 **92.4/100**

## 科学意义

- 2024 年 Demis Hassabis 和 John Jumper 因此获**诺贝尔化学奖**
- AlphaFold DB 已开放 **2 亿+** 蛋白质结构
- 加速了药物发现、酶设计和疾病研究
`,
    tags: ["论文", "模型"],
    source_urls: ["https://www.nature.com/articles/s41586-021-03819-2"],
    impact_score: 97,
    category: "paper",
    status: "published",
  },
  {
    id: "evt-017",
    title: "LoRA: 大模型高效微调方案",
    event_date: "2021-10-16",
    content_md: `
## 概述

微软研究团队提出 **LoRA** (Low-Rank Adaptation)，一种革命性的大模型参数高效微调 (PEFT) 技术。

## 原理

- 冻结预训练权重，只训练低秩分解矩阵
- 参数量减少 **10,000 倍**，性能几乎无损
- 可与任何 Transformer 层结合
- 多个 LoRA 模块可热切换

## 影响

LoRA 让个人开发者能在消费级 GPU 上微调大模型，是开源 LLM 生态爆发的关键技术推手之一。
`,
    tags: ["论文", "工具"],
    source_urls: ["https://arxiv.org/abs/2106.09685"],
    impact_score: 88,
    category: "paper",
    status: "published",
  },
  {
    id: "evt-018",
    title: "DeepSeek-R1: 开源推理模型的里程碑",
    event_date: "2025-01-20",
    content_md: `
## 概述

DeepSeek 发布 **DeepSeek-R1**，通过大规模强化学习训练的推理模型，在数学和编程推理能力上与 OpenAI o1 媲美，且完全开源。

## 创新

- 纯 RL 训练（无需 SFT 冷启动）即可涌现推理能力
- **Chain-of-Thought** 推理链可读可解释
- 通过蒸馏将推理能力迁移到小模型 (1.5B-70B)
- MIT 许可证，完全开源

## 震撼性影响

- 引发美股 AI 板块大幅震荡（NVIDIA 单日跌 **17%**）
- 证明 RL 驱动的推理能力可能是通往 AGI 的关键路径
- 开源推理模型首次达到商业闭源水平
`,
    tags: ["模型", "开源", "新闻"],
    source_urls: ["https://arxiv.org/abs/2501.12948"],
    impact_score: 96,
    category: "model",
    status: "published",
  },
];

export const PIPELINE_STEP_TITLES = {
  1: "Step 1: Profile Analytics Ingestion (Core Mind)",
  2: "Step 2: Autonomous Trend Filtering (Scout Mind)",
  3: "Step 3: Multi-Mind Strategy Synthesis (Community & Core)",
  4: "Step 4: Autonomous Deal Scoring (Business Mind)",
  5: "Step 5: Voice Adaptation & Context Learning (Core Mind)"
};

export const PIPELINE_STEP_DESCRIPTIONS = {
  1: "Ingesting zero-state creator analytics into persistent memory store.",
  2: "Scout Mind scanning and filtering emerging tech trends against creator boundaries.",
  3: "Community Mind fetching audience signals and Core Mind synthesizing script direction.",
  4: "Business Mind scoring deal match and generating autonomous pitch draft.",
  5: "Persisting user voice rules and re-synthesizing strategy with updated memory."
};

export const DEMO_STEP_TITLES = PIPELINE_STEP_TITLES;
export const DEMO_STEP_DESCRIPTIONS = PIPELINE_STEP_DESCRIPTIONS;

export const INITIAL_CREATOR_STATE = {
  creator_name: "Alex Rivera",
  brand_voice_attributes: ["Educational", "Technical yet accessible", "Direct and energetic", "Data-driven storytelling"],
  content_performance_history: [],
  audience_demographics: { primary_age: "22-35" },
  rejected_topics: ["Crypto trading bots", "Generic AI news clickbait"],
  monetization_benchmarks: { cpm_target: 45, minimum_deal_size: 5000 },
  learned_voice_rules: [],
  memory_nodes: []
};

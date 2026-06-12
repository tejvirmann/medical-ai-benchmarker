export interface SubgroupResult {
  group_name: string;
  group_value: string;
  n: number;
  auc: number;
  sensitivity: number;
  specificity: number;
}

export interface ModelResult {
  model_id: string;
  model_name: string;
  model_source: string;
  auc: number;
  sensitivity: number;
  specificity: number;
  bias_flagged: boolean;
  bias_description: string | null;
  subgroups: SubgroupResult[];
  latency_ms: number;
}

export interface ResultsData {
  id: string;
  n_cases: number;
  summary: string;
  results: ModelResult[];
}

export const DEMO_RESULTS: ResultsData = {
  id: "demo",
  n_cases: 500,
  summary:
    "BioViL-T achieves the highest AUC (0.97) among models with no detected subgroup bias — recommended for diverse patient populations. CheXNet is flagged for bias: 61+ age group (9% AUC gap vs. overall). Review subgroup performance before deployment in heterogeneous populations.",
  results: [
    {
      model_id: "chexnet",
      model_name: "CheXNet",
      model_source: "Stanford (open source)",
      auc: 0.933,
      sensitivity: 0.882,
      specificity: 0.851,
      bias_flagged: true,
      bias_description: "61+ age group (9% AUC gap vs. overall)",
      latency_ms: 42,
      subgroups: [
        { group_name: "sex", group_value: "male", n: 246, auc: 0.979, sensitivity: 0.91, specificity: 0.87 },
        { group_name: "sex", group_value: "female", n: 254, auc: 0.886, sensitivity: 0.84, specificity: 0.83 },
        { group_name: "age_group", group_value: "18-40", n: 130, auc: 0.993, sensitivity: 0.95, specificity: 0.91 },
        { group_name: "age_group", group_value: "41-60", n: 190, auc: 0.972, sensitivity: 0.90, specificity: 0.88 },
        { group_name: "age_group", group_value: "61+", n: 180, auc: 0.846, sensitivity: 0.75, specificity: 0.82 },
        { group_name: "scanner", group_value: "GE", n: 175, auc: 0.930, sensitivity: 0.88, specificity: 0.85 },
        { group_name: "scanner", group_value: "Siemens", n: 154, auc: 0.944, sensitivity: 0.90, specificity: 0.86 },
        { group_name: "scanner", group_value: "Philips", n: 171, auc: 0.930, sensitivity: 0.87, specificity: 0.84 },
      ],
    },
    {
      model_id: "biovil",
      model_name: "BioViL-T",
      model_source: "Microsoft Research",
      auc: 0.974,
      sensitivity: 0.928,
      specificity: 0.891,
      bias_flagged: false,
      bias_description: null,
      latency_ms: 67,
      subgroups: [
        { group_name: "sex", group_value: "male", n: 246, auc: 0.968, sensitivity: 0.92, specificity: 0.88 },
        { group_name: "sex", group_value: "female", n: 254, auc: 0.978, sensitivity: 0.93, specificity: 0.90 },
        { group_name: "age_group", group_value: "18-40", n: 130, auc: 0.975, sensitivity: 0.94, specificity: 0.90 },
        { group_name: "age_group", group_value: "41-60", n: 190, auc: 0.968, sensitivity: 0.92, specificity: 0.89 },
        { group_name: "age_group", group_value: "61+", n: 180, auc: 0.977, sensitivity: 0.93, specificity: 0.89 },
        { group_name: "scanner", group_value: "GE", n: 175, auc: 0.981, sensitivity: 0.94, specificity: 0.90 },
        { group_name: "scanner", group_value: "Siemens", n: 154, auc: 0.977, sensitivity: 0.93, specificity: 0.89 },
        { group_name: "scanner", group_value: "Philips", n: 171, auc: 0.965, sensitivity: 0.92, specificity: 0.88 },
      ],
    },
    {
      model_id: "vendor_x",
      model_name: "Vendor Model X",
      model_source: "Proprietary (FDA 510(k))",
      auc: 0.955,
      sensitivity: 0.862,
      specificity: 0.905,
      bias_flagged: false,
      bias_description: null,
      latency_ms: 28,
      subgroups: [
        { group_name: "sex", group_value: "male", n: 246, auc: 0.965, sensitivity: 0.87, specificity: 0.91 },
        { group_name: "sex", group_value: "female", n: 254, auc: 0.949, sensitivity: 0.86, specificity: 0.90 },
        { group_name: "age_group", group_value: "18-40", n: 130, auc: 0.962, sensitivity: 0.87, specificity: 0.92 },
        { group_name: "age_group", group_value: "41-60", n: 190, auc: 0.952, sensitivity: 0.86, specificity: 0.90 },
        { group_name: "age_group", group_value: "61+", n: 180, auc: 0.958, sensitivity: 0.86, specificity: 0.91 },
        { group_name: "scanner", group_value: "GE", n: 175, auc: 0.967, sensitivity: 0.87, specificity: 0.91 },
        { group_name: "scanner", group_value: "Siemens", n: 154, auc: 0.956, sensitivity: 0.86, specificity: 0.91 },
        { group_name: "scanner", group_value: "Philips", n: 171, auc: 0.944, sensitivity: 0.85, specificity: 0.90 },
      ],
    },
  ],
};

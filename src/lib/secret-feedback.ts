export type SecretFeedbackRating =
  | "very_satisfied"
  | "satisfied"
  | "ok"
  | "dissatisfied"
  | "very_dissatisfied";

export interface SecretFeedbackItem {
  id: string;
  reservationId: string;
  clinicId: string;
  clinicName: string;
  scheduledAt: string;
  rating: SecretFeedbackRating;
  impressionTags: string[];
  privateNote: string | null;
  submittedAt: string;
}

export interface SecretFeedbackPayload {
  metrics: {
    total: number;
    positive: number;
    neutral: number;
    negative: number;
  };
  items: SecretFeedbackItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export const secretFeedbackRatings: Array<{
  code: SecretFeedbackRating;
  label: string;
  compactLabel: string;
  assetPath: string;
}> = [
  {
    code: "very_satisfied",
    label: "매우 만족",
    compactLabel: "매우만족",
    assetPath: "/secret-feedback/piki_rate_very_satisfied.png",
  },
  {
    code: "satisfied",
    label: "만족",
    compactLabel: "만족",
    assetPath: "/secret-feedback/piki_rate_satisfied.png",
  },
  {
    code: "ok",
    label: "보통",
    compactLabel: "보통",
    assetPath: "/secret-feedback/piki_rate_ok.png",
  },
  {
    code: "dissatisfied",
    label: "아쉬움",
    compactLabel: "아쉬움",
    assetPath: "/secret-feedback/piki_rate_dissatisfied.png",
  },
  {
    code: "very_dissatisfied",
    label: "매우 아쉬움",
    compactLabel: "매우 아쉬움",
    assetPath: "/secret-feedback/piki_rate_very_dissatisfied.png",
  },
];

export const secretFeedbackImpressionTags = [
  { code: "pre_treatment_explanation", label: "꼼꼼한 사전 설명" },
  { code: "pain_management", label: "세심한 통증 관리" },
  { code: "transparent_cost", label: "투명한 비용" },
  { code: "kind_staff", label: "친절한 스태프 응대" },
  { code: "clean_facility", label: "쾌적하고 청결한 시설" },
  { code: "fast_treatment", label: "빠른 진료 진행" },
] as const;

export function secretFeedbackRatingLabel(
  value: string,
  compact = false,
) {
  const rating = secretFeedbackRatings.find((item) => item.code === value);
  if (!rating) return "-";
  return compact ? rating.compactLabel : rating.label;
}

export function formatSecretFeedbackDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en", {
      timeZone: "Asia/Seoul",
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  return `${parts.year}.${parts.month}.${parts.day}`;
}

const statusLabels: Record<string, string> = {
  pending_review: "심사 대기",
  approved: "승인",
  rejected: "반려",
  pending: "대기",
  active: "활성",
  revoked: "회수",
  redeemed: "사용됨",
  confirmed: "예약 확정",
  cancelled: "예약 취소",
  completed: "방문 완료",
  time_proposed: "예약 시간 확인 필요",
  alternative_proposed: "예약 시간 확인 필요",
  proposed: "예약 시간 확인 필요",
  reschedule_proposed: "예약 시간 확인 필요",
  unavailable: "예약 불가",
  reservation_unavailable: "예약 불가",
  declined: "예약 불가",
};

export function statusLabel(status: string) {
  return statusLabels[status] ?? status;
}

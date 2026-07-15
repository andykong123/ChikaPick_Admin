export type DentalSalesStatus = "미방문" | "방문" | "가입완료";

export interface DentalSalesRow {
  city: string;
  district: string;
  neighborhood: string;
  clinicName: string;
  phone: string;
  salesperson: string;
  inviteCode: string;
  status: DentalSalesStatus;
  detailStatus: string;
}

export interface DentalSalesFilters {
  city: string;
  district: string;
  clinicName: string;
  salesperson: string;
  status: string;
  detailStatus: string;
}

export const emptyDentalSalesFilters: DentalSalesFilters = {
  city: "서울특별시",
  district: "전체",
  clinicName: "",
  salesperson: "전체",
  status: "전체",
  detailStatus: "전체",
};

export function filterDentalSalesRows(
  rows: DentalSalesRow[],
  filters: DentalSalesFilters,
) {
  const clinicQuery = filters.clinicName.trim().toLocaleLowerCase("ko-KR");

  return rows.filter((row) => {
    if (filters.city !== "전체" && cityLabel(filters.city) !== row.city) return false;
    if (filters.district !== "전체" && filters.district !== row.district) return false;
    if (filters.salesperson !== "전체" && filters.salesperson !== row.salesperson) {
      return false;
    }
    if (filters.status !== "전체" && filters.status !== row.status) return false;
    if (filters.detailStatus !== "전체" && filters.detailStatus !== row.detailStatus) {
      return false;
    }
    if (clinicQuery && !row.clinicName.toLocaleLowerCase("ko-KR").includes(clinicQuery)) {
      return false;
    }
    return true;
  });
}

function cityLabel(value: string) {
  return value === "서울특별시" ? "서울" : value;
}

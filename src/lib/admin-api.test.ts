import assert from "node:assert/strict";
import { test } from "node:test";

import {
  assignAdminDentalSalesperson,
  createAdminMembershipPartner,
  createAdminExternalConnector,
  createAdminDentalSalesVisit,
  deleteAdminExternalConnector,
  deleteAdminMembershipPartner,
  fetchAdminAccountDirectory,
  fetchAdminAuditLog,
  fetchAdminClinicMembershipRequests,
  fetchAdminConsultationDirectory,
  fetchAdminDentalSales,
  fetchAdminDentalSalesDetail,
  fetchAdminExternalConnectors,
  fetchAdminInviteDirectory,
  fetchAdminManualHospitalSubmissions,
  fetchAdminMembershipManagement,
  fetchAdminPartnerClinicDetail,
  fetchAdminPartnerAccountDetail,
  fetchAdminPartnerClinics,
  fetchAdminReservationDirectory,
  fetchAdminSalesPerformance,
  fetchAdminSecretFeedback,
  fetchAdminTerms,
  inviteAdminAccount,
  isAdminApiNotFound,
  lockAdminAccount,
  lookupAdminChikapickAccount,
  lookupAdminPartnerAccount,
  publishAdminTermVersion,
  searchAdminPartnerAccounts,
  sendAdminPasswordReset,
  unlockAdminAccount,
  updateAdminMembershipPartner,
  withdrawAdminAccount,
} from "./admin-api.ts";
import { emptyDentalSalesFilters } from "./dental-sales.ts";

test("inviteAdminAccount posts super-admin invite details to the Admin API", async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const originalFetch = globalThis.fetch;
  process.env.NEXT_PUBLIC_CHIKAPICK_API_BASE_URL = "https://api.example.com/";
  globalThis.fetch = async (input, init) => {
    calls.push({ input, init });
    return new Response(JSON.stringify({ ok: true, message: "sent" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    await inviteAdminAccount("access-token", {
      email: "admin@example.com",
      fullName: "관리자",
      role: "super_admin",
      redirectTo: "https://admin.example.com",
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(calls[0]?.input, "https://api.example.com/api/v1/admin/accounts/invite");
  assert.equal(
    (calls[0]?.init?.headers as Record<string, string>).Authorization,
    "Bearer access-token",
  );
  assert.deepEqual(JSON.parse(calls[0]?.init?.body as string), {
    email: "admin@example.com",
    fullName: "관리자",
    role: "super_admin",
    redirectTo: "https://admin.example.com",
  });
});

test("createAdminExternalConnector posts a non-login contact and affiliation", async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const originalFetch = globalThis.fetch;
  process.env.NEXT_PUBLIC_CHIKAPICK_API_BASE_URL = "https://api.example.com";
  globalThis.fetch = async (input, init) => {
    calls.push({ input, init });
    return new Response(JSON.stringify({ ok: true, message: "added" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    await createAdminExternalConnector("access-token", {
      affiliation: "오스템 중랑구 담당",
      name: "박연결",
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(
    calls[0]?.input,
    "https://api.example.com/api/v1/admin/external-connectors",
  );
  assert.deepEqual(JSON.parse(calls[0]?.init?.body as string), {
    affiliation: "오스템 중랑구 담당",
    name: "박연결",
  });
});

test("fetchAdminExternalConnectors requests server pagination", async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const originalFetch = globalThis.fetch;
  process.env.NEXT_PUBLIC_CHIKAPICK_API_BASE_URL = "https://api.example.com";
  globalThis.fetch = async (input, init) => {
    calls.push({ input, init });
    return new Response(
      JSON.stringify({
        items: [],
        pagination: { page: 2, pageSize: 10, totalItems: 0, totalPages: 1 },
        canManage: true,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  try {
    await fetchAdminExternalConnectors("access-token", 2);
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(
    calls[0]?.input,
    "https://api.example.com/api/v1/admin/external-connectors?page=2&pageSize=10",
  );
});

test("membership management API sends server filters and row mutations", async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const originalFetch = globalThis.fetch;
  process.env.NEXT_PUBLIC_CHIKAPICK_API_BASE_URL = "https://api.example.com";
  globalThis.fetch = async (input, init) => {
    calls.push({ input, init });
    return new Response(JSON.stringify({ ok: true, items: [], pagination: {} }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    await fetchAdminMembershipManagement(
      "access-token",
      { category: "lab", query: " 서울 ", sort: "name" },
      2,
    );
    await updateAdminMembershipPartner("access-token", "partner/id", {
      isVisible: false,
      recommendedOrder: 2,
    });
    await deleteAdminMembershipPartner("access-token", "partner/id");
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(
    calls[0]?.input,
    "https://api.example.com/api/v1/admin/memberships?page=2&pageSize=6&sort=name&category=lab&search=%EC%84%9C%EC%9A%B8",
  );
  assert.equal(calls[1]?.input, "https://api.example.com/api/v1/admin/memberships/partner%2Fid");
  assert.equal(calls[1]?.init?.method, "PATCH");
  assert.deepEqual(JSON.parse(calls[1]?.init?.body as string), {
    isVisible: false,
    recommendedOrder: 2,
  });
  assert.equal(calls[2]?.init?.method, "DELETE");
});

test("membership partner registration sends the complete form as multipart data", async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const originalFetch = globalThis.fetch;
  process.env.NEXT_PUBLIC_CHIKAPICK_API_BASE_URL = "https://api.example.com";
  globalThis.fetch = async (input, init) => {
    calls.push({ input, init });
    return new Response(JSON.stringify({ ok: true, message: "created" }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    await createAdminMembershipPartner("access-token", {
      attachmentFile: null,
      attachmentLabel: "소개서",
      benefitItems: ["첫 달 10% 할인"],
      cardImage: null,
      category: "lab",
      contentType: "section",
      description: "정밀 기공 파트너",
      detailDescription: "디지털 워크플로우",
      detailImage: null,
      detailTitle: "서울기공연구소",
      inquiryButtonLabel: "상담 신청",
      inquiryMethod: "external_link",
      inquiryValue: "https://example.com",
      intro: "업체 소개",
      isPreferred: true,
      isVisible: true,
      name: "서울기공연구소",
      recommendedOrder: 1,
      richContent: "상세 본문",
      serviceTags: ["CAD/CAM"],
      strengths: ["3D 스캐너 보유"],
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(calls[0]?.input, "https://api.example.com/api/v1/admin/memberships");
  assert.equal(calls[0]?.init?.method, "POST");
  assert.equal(
    (calls[0]?.init?.headers as Record<string, string>)["Content-Type"],
    undefined,
  );
  const body = calls[0]?.init?.body as FormData;
  assert.equal(body.get("name"), "서울기공연구소");
  assert.equal(body.get("isPreferred"), "true");
  assert.deepEqual(JSON.parse(String(body.get("strengths"))), ["3D 스캐너 보유"]);
});

test("fetchAdminSecretFeedback requests the anonymous feedback directory", async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const originalFetch = globalThis.fetch;
  process.env.NEXT_PUBLIC_CHIKAPICK_API_BASE_URL = "https://api.example.com";
  globalThis.fetch = async (input, init) => {
    calls.push({ input, init });
    return new Response(
      JSON.stringify({
        metrics: { total: 0, positive: 0, neutral: 0, negative: 0 },
        items: [],
        pagination: { page: 2, pageSize: 10, totalItems: 0, totalPages: 1 },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  try {
    await fetchAdminSecretFeedback("access-token", 2);
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(
    calls[0]?.input,
    "https://api.example.com/api/v1/admin/secret-feedback?page=2&pageSize=10",
  );
});

test("lookupAdminChikapickAccount posts exact email lookup and explicit masking intent", async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const originalFetch = globalThis.fetch;
  process.env.NEXT_PUBLIC_CHIKAPICK_API_BASE_URL = "https://api.example.com";
  globalThis.fetch = async (input, init) => {
    calls.push({ input, init });
    return new Response(JSON.stringify({ account: {}, masked: false }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    await lookupAdminChikapickAccount("access-token", {
      email: "patient@example.com",
      unmask: true,
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(
    calls[0]?.input,
    "https://api.example.com/api/v1/admin/chikapick-accounts/lookup",
  );
  assert.equal(calls[0]?.init?.method, "POST");
  assert.deepEqual(JSON.parse(calls[0]?.init?.body as string), {
    email: "patient@example.com",
    unmask: true,
  });
});

test("searchAdminPartnerAccounts keeps private directory filters in the POST body", async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const originalFetch = globalThis.fetch;
  process.env.NEXT_PUBLIC_CHIKAPICK_API_BASE_URL = "https://api.example.com";
  globalThis.fetch = async (input, init) => {
    calls.push({ input, init });
    return new Response(JSON.stringify({ items: [], pagination: {} }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    await searchAdminPartnerAccounts("access-token", {
      query: "01012345678",
      page: 2,
      pageSize: 10,
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(
    calls[0]?.input,
    "https://api.example.com/api/v1/admin/partner-accounts/search",
  );
  assert.equal(calls[0]?.init?.method, "POST");
  assert.deepEqual(JSON.parse(calls[0]?.init?.body as string), {
    query: "01012345678",
    page: 2,
    pageSize: 10,
  });
});

test("Partners account detail APIs use an exact-email POST and encoded UUID path", async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const originalFetch = globalThis.fetch;
  process.env.NEXT_PUBLIC_CHIKAPICK_API_BASE_URL = "https://api.example.com";
  globalThis.fetch = async (input, init) => {
    calls.push({ input, init });
    return new Response(JSON.stringify({ account: {} }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    await lookupAdminPartnerAccount("access-token", {
      email: "partner@example.com",
      unmask: true,
    });
    await fetchAdminPartnerAccountDetail("access-token", "user/id");
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(
    calls[0]?.input,
    "https://api.example.com/api/v1/admin/partner-accounts/lookup",
  );
  assert.deepEqual(JSON.parse(calls[0]?.init?.body as string), {
    email: "partner@example.com",
    unmask: true,
  });
  assert.equal(
    calls[1]?.input,
    "https://api.example.com/api/v1/admin/partner-accounts/user%2Fid",
  );
  assert.equal(calls[1]?.init?.method, undefined);
});

test("Admin API errors preserve HTTP not-found state for empty search views", async () => {
  const originalFetch = globalThis.fetch;
  process.env.NEXT_PUBLIC_CHIKAPICK_API_BASE_URL = "https://api.example.com";
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ error: "NOT_FOUND", message: "없음" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  try {
    await assert.rejects(
      () =>
        lookupAdminPartnerAccount("access-token", {
          email: "missing@example.com",
        }),
      (error) => isAdminApiNotFound(error),
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("deleteAdminExternalConnector deletes the selected contact", async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const originalFetch = globalThis.fetch;
  process.env.NEXT_PUBLIC_CHIKAPICK_API_BASE_URL = "https://api.example.com";
  globalThis.fetch = async (input, init) => {
    calls.push({ input, init });
    return new Response(JSON.stringify({ ok: true, message: "deleted" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    await deleteAdminExternalConnector("access-token", "connector/1");
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(
    calls[0]?.input,
    "https://api.example.com/api/v1/admin/external-connectors/connector%2F1",
  );
  assert.equal(calls[0]?.init?.method, "DELETE");
});

test("sendAdminPasswordReset posts the target admin id", async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const originalFetch = globalThis.fetch;
  process.env.NEXT_PUBLIC_CHIKAPICK_API_BASE_URL = "https://api.example.com";
  globalThis.fetch = async (input, init) => {
    calls.push({ input, init });
    return new Response(JSON.stringify({ ok: true, message: "sent" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    await sendAdminPasswordReset(
      "access-token",
      "admin-2",
      "https://admin.example.com/reset",
    );
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(
    calls[0]?.input,
    "https://api.example.com/api/v1/admin/accounts/admin-2/password-reset",
  );
  assert.deepEqual(JSON.parse(calls[0]?.init?.body as string), {
    redirectTo: "https://admin.example.com/reset",
  });
});

test("unlockAdminAccount posts the target admin id", async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const originalFetch = globalThis.fetch;
  process.env.NEXT_PUBLIC_CHIKAPICK_API_BASE_URL = "https://api.example.com";
  globalThis.fetch = async (input, init) => {
    calls.push({ input, init });
    return new Response(JSON.stringify({ ok: true, message: "unlocked" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    await unlockAdminAccount("access-token", "admin-2");
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(
    calls[0]?.input,
    "https://api.example.com/api/v1/admin/accounts/admin-2/unlock",
  );
  assert.equal(calls[0]?.init?.method, "POST");
});

test("lockAdminAccount posts the target admin id", async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const originalFetch = globalThis.fetch;
  process.env.NEXT_PUBLIC_CHIKAPICK_API_BASE_URL = "https://api.example.com";
  globalThis.fetch = async (input, init) => {
    calls.push({ input, init });
    return new Response(JSON.stringify({ ok: true, message: "locked" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    await lockAdminAccount("access-token", "admin-2");
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(
    calls[0]?.input,
    "https://api.example.com/api/v1/admin/accounts/admin-2/lock",
  );
  assert.equal(calls[0]?.init?.method, "POST");
});

test("withdrawAdminAccount deletes the target admin access", async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const originalFetch = globalThis.fetch;
  process.env.NEXT_PUBLIC_CHIKAPICK_API_BASE_URL = "https://api.example.com";
  globalThis.fetch = async (input, init) => {
    calls.push({ input, init });
    return new Response(JSON.stringify({ ok: true, message: "withdrawn" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    await withdrawAdminAccount("access-token", "admin-2");
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(
    calls[0]?.input,
    "https://api.example.com/api/v1/admin/accounts/admin-2",
  );
  assert.equal(calls[0]?.init?.method, "DELETE");
});

test("fetchAdminAccountDirectory sends role, search, and pagination", async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const originalFetch = globalThis.fetch;
  process.env.NEXT_PUBLIC_CHIKAPICK_API_BASE_URL = "https://api.example.com";
  globalThis.fetch = async (input, init) => {
    calls.push({ input, init });
    return new Response(
      JSON.stringify({
        items: [],
        pagination: { page: 2, pageSize: 10, totalItems: 0, totalPages: 1 },
        canManage: true,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  try {
    await fetchAdminAccountDirectory(
      "access-token",
      { role: "sales", query: " 박준호 " },
      2,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }

  const url = new URL(calls[0]?.input.toString() ?? "");
  assert.equal(url.pathname, "/api/v1/admin/accounts");
  assert.equal(url.searchParams.get("role"), "sales");
  assert.equal(url.searchParams.get("query"), "박준호");
  assert.equal(url.searchParams.get("page"), "2");
  assert.equal(url.searchParams.get("pageSize"), "10");
});

test("fetchAdminManualHospitalSubmissions requests the Figma review page", async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const originalFetch = globalThis.fetch;
  process.env.NEXT_PUBLIC_CHIKAPICK_API_BASE_URL = "https://api.example.com";
  globalThis.fetch = async (input, init) => {
    calls.push({ input, init });
    return new Response(
      JSON.stringify({
        items: [],
        pagination: { page: 2, pageSize: 10, totalItems: 12, totalPages: 2 },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  try {
    await fetchAdminManualHospitalSubmissions("access-token", 2);
  } finally {
    globalThis.fetch = originalFetch;
  }

  const url = new URL(calls[0]?.input.toString() ?? "");
  assert.equal(url.pathname, "/api/v1/admin/manual-hospital-submissions");
  assert.equal(url.searchParams.get("page"), "2");
  assert.equal(url.searchParams.get("pageSize"), "10");
  assert.equal(
    (calls[0]?.init?.headers as Record<string, string>).Authorization,
    "Bearer access-token",
  );
});

test("fetchAdminDentalSales sends server-side filters and pagination", async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const originalFetch = globalThis.fetch;
  process.env.NEXT_PUBLIC_CHIKAPICK_API_BASE_URL = "https://api.example.com";
  globalThis.fetch = async (input, init) => {
    calls.push({ input, init });
    return new Response(
      JSON.stringify({
        items: [],
        pagination: { page: 3, pageSize: 20, totalItems: 0, totalPages: 1 },
        filterOptions: { regions: [], districts: [], salespeople: [] },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  try {
    await fetchAdminDentalSales(
      "access-token",
      {
        ...emptyDentalSalesFilters,
        city: "서울특별시",
        district: "강남구",
        clinicName: " 서울 ",
        status: "VISITING",
      },
      3,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }

  const url = new URL(calls[0]?.input.toString() ?? "");
  assert.equal(url.pathname, "/api/v1/admin/dental-sales");
  assert.equal(url.searchParams.get("page"), "3");
  assert.equal(url.searchParams.get("city"), "서울특별시");
  assert.equal(url.searchParams.get("district"), "강남구");
  assert.equal(url.searchParams.get("clinicName"), "서울");
  assert.equal(url.searchParams.get("status"), "VISITING");
  assert.equal(url.searchParams.has("salespersonId"), false);
});

test("fetchAdminDentalSalesDetail requests the selected profile and visit page", async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const originalFetch = globalThis.fetch;
  process.env.NEXT_PUBLIC_CHIKAPICK_API_BASE_URL = "https://api.example.com";
  globalThis.fetch = async (input, init) => {
    calls.push({ input, init });
    return new Response(
      JSON.stringify({
        profile: {},
        visits: [],
        visitPagination: { page: 2, pageSize: 20, totalItems: 0, totalPages: 1 },
        salespeople: [],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  try {
    await fetchAdminDentalSalesDetail("access-token", "sales/1", 2);
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(
    calls[0]?.input,
    "https://api.example.com/api/v1/admin/dental-sales/sales%2F1?visitPage=2",
  );
});

test("fetchAdminSalesPerformance sends the Super Admin report filters", async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const originalFetch = globalThis.fetch;
  process.env.NEXT_PUBLIC_CHIKAPICK_API_BASE_URL = "https://api.example.com";
  globalThis.fetch = async (input, init) => {
    calls.push({ input, init });
    return new Response(
      JSON.stringify({
        items: [],
        metrics: {
          salespersonOnly: 0,
          externalConnectorOnly: 0,
          bothAssigned: 0,
        },
        pagination: { page: 2, pageSize: 10, totalItems: 0, totalPages: 1 },
        filterOptions: { salespeople: [], externalConnectors: [] },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  try {
    await fetchAdminSalesPerformance(
      "access-token",
      {
        month: "2026-06",
        salespersonId: " sales-1 ",
        externalConnectorId: "connector-1",
        detailStatus: "ACTIVE",
      },
      2,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }

  const url = new URL(calls[0]?.input.toString() ?? "");
  assert.equal(url.pathname, "/api/v1/admin/sales-performance");
  assert.equal(url.searchParams.get("month"), "2026-06");
  assert.equal(url.searchParams.get("salespersonId"), "sales-1");
  assert.equal(url.searchParams.get("externalConnectorId"), "connector-1");
  assert.equal(url.searchParams.get("detailStatus"), "ACTIVE");
  assert.equal(url.searchParams.get("page"), "2");
});

test("fetchAdminPartnerClinics sends the Figma search and pagination query", async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const originalFetch = globalThis.fetch;
  process.env.NEXT_PUBLIC_CHIKAPICK_API_BASE_URL = "https://api.example.com";
  globalThis.fetch = async (input, init) => {
    calls.push({ input, init });
    return new Response(
      JSON.stringify({
        items: [],
        pagination: { page: 2, pageSize: 10, totalItems: 0, totalPages: 1 },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  try {
    await fetchAdminPartnerClinics("access-token", "  대표 치과  ", 2);
  } finally {
    globalThis.fetch = originalFetch;
  }

  const url = new URL(calls[0]?.input.toString() ?? "");
  assert.equal(url.pathname, "/api/v1/admin/partner-clinics");
  assert.equal(url.searchParams.get("page"), "2");
  assert.equal(url.searchParams.get("pageSize"), "10");
  assert.equal(url.searchParams.get("query"), "대표 치과");
});

test("fetchAdminPartnerClinicDetail encodes the selected clinic id", async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const originalFetch = globalThis.fetch;
  process.env.NEXT_PUBLIC_CHIKAPICK_API_BASE_URL = "https://api.example.com";
  globalThis.fetch = async (input, init) => {
    calls.push({ input, init });
    return new Response(JSON.stringify({ hospitalInformation: {} }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    await fetchAdminPartnerClinicDetail("access-token", "clinic/1");
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(
    calls[0]?.input,
    "https://api.example.com/api/v1/admin/partner-clinics/clinic%2F1",
  );
});

test("assignAdminDentalSalesperson patches the assignee selected in the detail card", async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const originalFetch = globalThis.fetch;
  process.env.NEXT_PUBLIC_CHIKAPICK_API_BASE_URL = "https://api.example.com";
  globalThis.fetch = async (input, init) => {
    calls.push({ input, init });
    return new Response(JSON.stringify({ ok: true, message: "saved" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    await assignAdminDentalSalesperson(
      "access-token",
      "sales/1",
      "admin-2",
      "connector-1",
    );
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(
    calls[0]?.input,
    "https://api.example.com/api/v1/admin/dental-sales/sales%2F1",
  );
  assert.equal(calls[0]?.init?.method, "PATCH");
  assert.deepEqual(JSON.parse(calls[0]?.init?.body as string), {
    assignedSalespersonUserId: "admin-2",
    externalConnectorId: "connector-1",
  });
});

test("createAdminDentalSalesVisit posts an immutable visit payload", async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const originalFetch = globalThis.fetch;
  process.env.NEXT_PUBLIC_CHIKAPICK_API_BASE_URL = "https://api.example.com";
  globalThis.fetch = async (input, init) => {
    calls.push({ input, init });
    return new Response(JSON.stringify({ ok: true, message: "saved" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  const body = {
    visitedAt: "2026-07-16T03:00:00.000Z",
    salespersonUserId: "admin-1",
    detailStatus: "CODE_SHARED" as const,
    note: "초대 코드 전달",
  };
  try {
    await createAdminDentalSalesVisit("access-token", "sales/1", body);
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(
    calls[0]?.input,
    "https://api.example.com/api/v1/admin/dental-sales/sales%2F1/visits",
  );
  assert.equal(calls[0]?.init?.method, "POST");
  assert.deepEqual(JSON.parse(calls[0]?.init?.body as string), body);
});

test("operational directory clients send only applied server filters", async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const originalFetch = globalThis.fetch;
  process.env.NEXT_PUBLIC_CHIKAPICK_API_BASE_URL = "https://api.example.com";
  globalThis.fetch = async (input, init) => {
    calls.push({ input, init });
    return new Response(
      JSON.stringify({
        items: [],
        pagination: { page: 2, pageSize: 10, totalItems: 0, totalPages: 1 },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  try {
    await fetchAdminReservationDirectory(
      "access-token",
      { query: "  서울 치과  ", status: "confirmed", bookingSource: "all" },
      2,
    );
    await fetchAdminConsultationDirectory(
      "access-token",
      { query: "", status: "pending" },
      1,
    );
    await fetchAdminInviteDirectory(
      "access-token",
      { query: "강남", status: "active", role: "doctor" },
      3,
    );
    await fetchAdminClinicMembershipRequests(
      "access-token",
      { query: "홍길동", role: "staff" },
      4,
    );
    await fetchAdminAuditLog(
      "access-token",
      { action: " terms.version ", result: "success" },
      5,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }

  const reservationUrl = new URL(calls[0]?.input.toString() ?? "");
  assert.equal(reservationUrl.pathname, "/api/v1/admin/reservations");
  assert.equal(reservationUrl.searchParams.get("page"), "2");
  assert.equal(reservationUrl.searchParams.get("query"), "서울 치과");
  assert.equal(reservationUrl.searchParams.get("status"), "confirmed");
  assert.equal(reservationUrl.searchParams.has("bookingSource"), false);

  assert.equal(
    calls[1]?.input,
    "https://api.example.com/api/v1/admin/consultations?page=1&pageSize=10&status=pending",
  );
  assert.equal(
    calls[2]?.input,
    "https://api.example.com/api/v1/admin/invites?page=3&pageSize=10&query=%EA%B0%95%EB%82%A8&status=active&role=doctor",
  );
  assert.equal(
    calls[3]?.input,
    "https://api.example.com/api/v1/admin/clinic-memberships?page=4&pageSize=10&query=%ED%99%8D%EA%B8%B8%EB%8F%99&role=staff",
  );
  assert.equal(
    calls[4]?.input,
    "https://api.example.com/api/v1/admin/audit-log?page=5&pageSize=20&action=terms.version&result=success",
  );
});

test("terms management loads history and publishes a new immutable version", async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const originalFetch = globalThis.fetch;
  process.env.NEXT_PUBLIC_CHIKAPICK_API_BASE_URL = "https://api.example.com";
  globalThis.fetch = async (input, init) => {
    calls.push({ input, init });
    return new Response(JSON.stringify({ items: [], canManage: true, ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    await fetchAdminTerms("access-token");
    await publishAdminTermVersion("access-token", "document/id", {
      contentUrl: "https://example.com/terms/v2",
      changeSummary: "예약 취소 조항 변경",
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(calls[0]?.input, "https://api.example.com/api/v1/admin/terms");
  assert.equal(
    calls[1]?.input,
    "https://api.example.com/api/v1/admin/terms/document%2Fid/versions",
  );
  assert.equal(calls[1]?.init?.method, "POST");
  assert.deepEqual(JSON.parse(calls[1]?.init?.body as string), {
    contentUrl: "https://example.com/terms/v2",
    changeSummary: "예약 취소 조항 변경",
  });
});

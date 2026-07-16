import assert from "node:assert/strict";
import { test } from "node:test";

import {
  assignAdminDentalSalesperson,
  createAdminExternalConnector,
  createAdminDentalSalesVisit,
  fetchAdminDentalSales,
  fetchAdminDentalSalesDetail,
  fetchAdminPartnerClinicDetail,
  fetchAdminPartnerClinics,
  fetchAdminSalesPerformance,
  inviteAdminAccount,
  sendAdminPasswordReset,
  unlockAdminAccount,
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

test("createAdminExternalConnector posts a non-login contact name", async () => {
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
    await createAdminExternalConnector("access-token", "박연결");
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(
    calls[0]?.input,
    "https://api.example.com/api/v1/admin/external-connectors",
  );
  assert.deepEqual(JSON.parse(calls[0]?.init?.body as string), { name: "박연결" });
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

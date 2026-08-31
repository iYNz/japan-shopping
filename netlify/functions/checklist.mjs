import { getStore } from "@netlify/blobs";

const STORE_NAME = "kansai-checklist";
const CURRENT_KEY = "current";
const HISTORY_PREFIX = "history-";
const HISTORY_LIMIT = 20;
const MAX_ITEMS = 200;
const MAX_LABEL_LEN = 120;
const MAX_DETAIL_LEN = 300;
const MAX_ID_LEN = 60;
const DAY_IDS = ["day1","day2","day3","day4","day5"];

const DEFAULT_PREP = [
  { id: "prep-default-1",  label: "하루카 QR 티켓 캡처",          detail: "예약 완료 #BSQ675585 · 2인 ₩37,200 · E-티켓(QR 입장) · 9.4 14:16 KIX → 15:35 교토역 · 오프라인 대비 스크린샷", checked: true },
  { id: "prep-default-2",  label: "라피트 QR/바코드 캡처",        detail: "좌석 지정 완료 KLOOK-20260831-3WGG · β51호 난바 15:35 → KIX 16:12 · 01호차 27·28번 · 이용개시 전 앱에서 편 변경 가능", checked: true },
  { id: "prep-default-3",  label: "Visit Japan Web 사전 등록",    detail: "입국 속도를 좌우 · 2인 각각 등록 · QR 캡처해두기", checked: false },
  { id: "prep-default-4",  label: "인천공항 예약주차",            detail: "출차 3일 전까지 · 5일 45,000원 (감면 대상이면 22,500원)", checked: false },
  { id: "prep-default-5",  label: "기온탄토 디너 오픈 시각 확인",  detail: "오픈런 확정 (예약 X) · 1일차 9.4 (금) 17:30 목표 · 구글맵/현장 확인 후 10~15분 전 도착 · 오픈이 18:00이면 뒤 일정 30분씩 밀기", checked: false },
  { id: "prep-default-6",  label: "타이쇼 하나나 오픈 시각 확인",  detail: "오픈런 확정 (예약 X) · 2일차 9.5 (토) 11:00 오픈 기준 10:20 줄서기 · 토요일이라 일찍", checked: false },
  { id: "prep-default-7",  label: "접이식 우산 2개",              detail: "1·3·5일차 강수 60~70% · 캐리어에 미리 넣기", checked: false },
  { id: "prep-default-8",  label: "출발 3일 전 예보 재확인",       detail: "9월 초는 태풍 시즌 · 항공/기차 결항 여부 체크", checked: false },
  { id: "prep-default-9",  label: "엔화 환전",                    detail: "타코야키 · 쿠시카츠 · 가챠 등 현금 전용 매장 대비", checked: false },
  { id: "prep-default-10", label: "교통 IC카드 준비",             detail: "ICOCA/스이카 실물 또는 모바일 스이카(애플페이) 등록", checked: false },
  { id: "prep-default-11", label: "여권 유효기간 확인",           detail: "6개월 이상 권장 (출국일 기준 2027.3 이후)", checked: false },
  { id: "prep-default-12", label: "식당 예약번호 3건 캡처",        detail: "히로시게 #HDZEZ33X9V · 고리짱 #CJP2Q3RKGG · 키타로우즈시 #4GQTAAV3ZS (예약자 Yun JungA)", checked: false }
];

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}

function sanitizePack(it) {
  if (!it || typeof it !== "object") return null;
  const label = String(it.label ?? "").trim();
  if (!label) return null;
  return {
    id: String(it.id ?? ("i-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7))).slice(0, MAX_ID_LEN),
    label: label.slice(0, MAX_LABEL_LEN),
    checked: Boolean(it.checked)
  };
}

function sanitizePrep(it) {
  if (!it || typeof it !== "object") return null;
  const label = String(it.label ?? "").trim();
  if (!label) return null;
  return {
    id: String(it.id ?? ("p-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7))).slice(0, MAX_ID_LEN),
    label: label.slice(0, MAX_LABEL_LEN),
    detail: String(it.detail ?? "").trim().slice(0, MAX_DETAIL_LEN),
    checked: Boolean(it.checked)
  };
}

function sanitizeNote(it) {
  if (!it || typeof it !== "object") return null;
  const label = String(it.label ?? "").trim();
  if (!label) return null;
  return {
    id: String(it.id ?? ("n-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7))).slice(0, MAX_ID_LEN),
    label: label.slice(0, MAX_LABEL_LEN),
    checked: Boolean(it.checked)
  };
}

function normalize(raw) {
  const r = raw && typeof raw === "object" ? raw : {};
  const packingSrc = r.packing || {};
  const packing = {
    hyungin: Array.isArray(packingSrc.hyungin) ? packingSrc.hyungin.map(sanitizePack).filter(Boolean) : [],
    junga: Array.isArray(packingSrc.junga) ? packingSrc.junga.map(sanitizePack).filter(Boolean) : []
  };
  // prep: 명시된 배열이 있으면 그대로, 저장된 적 없는 첫 로드면 시드 제공
  let prep;
  if (Array.isArray(r.prep)) {
    prep = r.prep.map(sanitizePrep).filter(Boolean);
  } else if (r.version === 1) {
    prep = [];
  } else {
    prep = DEFAULT_PREP.slice();
  }
  const notesSrc = (r.dayNotes && typeof r.dayNotes === "object") ? r.dayNotes : {};
  const dayNotes = {};
  for (const id of DAY_IDS) {
    const arr = notesSrc[id];
    dayNotes[id] = Array.isArray(arr) ? arr.map(sanitizeNote).filter(Boolean) : [];
  }
  return { packing, prep, dayNotes };
}

async function handle(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  let store;
  try {
    store = getStore({ name: STORE_NAME, consistency: "strong" });
  } catch (e) {
    console.error("[checklist] getStore failed:", e);
    return json({ error: "blobs_init_failed", detail: String(e?.message ?? e) }, 500);
  }

  if (req.method === "GET") {
    try {
      const data = await store.get(CURRENT_KEY, { type: "json" });
      const norm = normalize(data || {});
      return json({
        version: 1,
        updatedAt: data?.updatedAt ?? null,
        packing: norm.packing,
        prep: norm.prep,
        dayNotes: norm.dayNotes
      });
    } catch (e) {
      console.error("[checklist] GET failed:", e);
      return json({ error: "get_failed", detail: String(e?.message ?? e) }, 500);
    }
  }

  if (req.method === "POST") {
    let body;
    try { body = await req.json(); }
    catch { return json({ error: "invalid_json" }, 400); }

    const norm = normalize(body);
    const totalPack = norm.packing.hyungin.length + norm.packing.junga.length;
    const totalPrep = norm.prep.length;
    const totalNotes = Object.values(norm.dayNotes).reduce((s, a) => s + a.length, 0);
    if (totalPack > MAX_ITEMS || totalPrep > MAX_ITEMS || totalNotes > MAX_ITEMS * 2) {
      return json({ error: "too_many_items", max: MAX_ITEMS }, 413);
    }

    const updatedAt = new Date().toISOString();
    const payload = {
      version: 1,
      updatedAt,
      packing: norm.packing,
      prep: norm.prep,
      dayNotes: norm.dayNotes
    };

    try {
      await store.setJSON(CURRENT_KEY, payload);
    } catch (e) {
      console.error("[checklist] setJSON failed:", e);
      return json({ error: "save_failed", detail: String(e?.message ?? e) }, 500);
    }

    try {
      const histKey = HISTORY_PREFIX + updatedAt.replace(/[:.]/g, "-");
      await store.setJSON(histKey, payload);
      const listing = await store.list({ prefix: HISTORY_PREFIX });
      const blobs = listing?.blobs ?? [];
      if (blobs.length > HISTORY_LIMIT) {
        const sorted = blobs.slice().sort((a, b) => a.key.localeCompare(b.key));
        const toDelete = sorted.slice(0, sorted.length - HISTORY_LIMIT);
        await Promise.all(toDelete.map((b) => store.delete(b.key).catch(() => {})));
      }
    } catch (e) {
      console.warn("[checklist] history backup failed:", e);
    }

    return json(payload);
  }

  return json({ error: "method_not_allowed" }, 405);
}

export default async (req) => {
  try {
    return await handle(req);
  } catch (e) {
    console.error("[checklist] unhandled error:", e);
    return json({ error: "unhandled", detail: String(e?.message ?? e), stack: e?.stack }, 500);
  }
};

export const config = {
  path: "/api/checklist"
};

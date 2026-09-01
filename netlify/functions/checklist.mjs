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

// 준비물 시드 — 2026.6 발리/싱가포르 여행 리스트 기반, 간사이(9월·도보 많음·온천숙소·쇼핑) 기준으로 각색
// 제외한 항목: 수영복 · 아쿠아슈즈 · 휴대폰 방수팩 · 샌달 · 모기패치 · 벌레물림약 ·
//              바디스크럽 · 알로에팩 · 입욕제(대욕장 있음) · 수면베개/안대(비행 1시간 45분)
const DEFAULT_PACK_HYUNGIN = [
  { id: "pk-h-1",  label: "여권" },
  { id: "pk-h-2",  label: "주민등록증" },
  { id: "pk-h-3",  label: "트래블 월릿 (엔화 충전)" },
  { id: "pk-h-4",  label: "항공 e티켓 + 하루카/라피트 QR 캡처" },
  { id: "pk-h-4b", label: "차키 (여행 내내 분실 주의)" },
  { id: "pk-h-5",  label: "일본용 변환 어댑터 (A타입) ★필수" },
  { id: "pk-h-6",  label: "아이폰 충전기" },
  { id: "pk-h-7",  label: "갤럭시 충전기" },
  { id: "pk-h-8",  label: "보조배터리 (기내 반입 · 위탁 금지)" },
  { id: "pk-h-9",  label: "스위치2 (하루카/라피트 이동시간용)" },
  { id: "pk-h-10", label: "옷 5일치" },
  { id: "pk-h-11", label: "팬티 5일치" },
  { id: "pk-h-12", label: "얇은 셔츠 및 가디건 (냉방 대비)" },
  { id: "pk-h-13", label: "비행기 탑승용 편한 옷 1벌" },
  { id: "pk-h-14", label: "여분 신발 (하루 2만보 대비)" },
  { id: "pk-h-15", label: "모자 1개" },
  { id: "pk-h-16", label: "옷 담는 지퍼백" },
  { id: "pk-h-17", label: "여행용 세면도구 세트 (칫솔, 치약)" },
  { id: "pk-h-18", label: "헤어 스프레이" },
  { id: "pk-h-19", label: "올인원 로션" },
  { id: "pk-h-20", label: "선크림" },
  { id: "pk-h-21", label: "손소독제" },
  { id: "pk-h-22", label: "물티슈" },
  { id: "pk-h-23", label: "마스크" },
  { id: "pk-h-24", label: "지사제 및 소화제 (상비약)" },
  { id: "pk-h-25", label: "멀미약" },
  { id: "pk-h-26", label: "니플패처 (도보 많음)" },
  { id: "pk-h-27", label: "접이식 우산" },
  { id: "pk-h-28", label: "대형 캐리어 (쇼핑 여유분 남기기)" },
  { id: "pk-h-29", label: "에코백 (일본 봉투 유료)" }
];

const DEFAULT_PACK_JUNGA = [
  { id: "pk-j-1",  label: "여권" },
  { id: "pk-j-2",  label: "주민등록증" },
  { id: "pk-j-3",  label: "하나카드 (엔화 트래블로그)" },
  { id: "pk-j-4",  label: "화장품" },
  { id: "pk-j-5",  label: "선크림" },
  { id: "pk-j-6",  label: "양산 (9월 초 33°C)" },
  { id: "pk-j-7",  label: "바디로션" },
  { id: "pk-j-8",  label: "고데기 (일본 100V · 듀얼볼트 확인)" },
  { id: "pk-j-9",  label: "옷 5일치" },
  { id: "pk-j-10", label: "팬티 5일치" },
  { id: "pk-j-11", label: "얇은 가디건 (냉방 대비)" },
  { id: "pk-j-12", label: "비행기 탑승용 편한 옷 1벌" },
  { id: "pk-j-13", label: "신발 2개 (하루 2만보 대비)" },
  { id: "pk-j-14", label: "모자 1개" },
  { id: "pk-j-15", label: "옷 담는 지퍼백" },
  { id: "pk-j-16", label: "스위치2" },
  { id: "pk-j-17", label: "약" },
  { id: "pk-j-18", label: "안경" },
  { id: "pk-j-19", label: "렌즈" },
  { id: "pk-j-20", label: "생리용품" },
  { id: "pk-j-21", label: "접이식 우산" },
  { id: "pk-j-22", label: "소형 캐리어" },
  { id: "pk-j-23", label: "에코백 (일본 봉투 유료)" }
];

const DEFAULT_PREP = [
  { id: "prep-default-1",  label: "하루카 QR 티켓 캡처",          detail: "예약 완료 #BSQ675585 · 2인 ₩37,200 · E-티켓(QR 입장) · 9.4 14:16 KIX → 15:35 교토역 · 오프라인 대비 스크린샷", checked: true },
  { id: "prep-default-2",  label: "라피트 QR/바코드 캡처",        detail: "좌석 지정 완료 KLOOK-20260831-3WGG · β51호 난바 15:35 → KIX 16:12 · 01호차 27·28번 · 이용개시 전 앱에서 편 변경 가능", checked: true },
  { id: "prep-default-3",  label: "Visit Japan Web 사전 등록",    detail: "입국 속도를 좌우 · 2인 각각 등록 · QR 캡처해두기", checked: false },
  { id: "prep-default-4",  label: "공항 01·02번 셔틀 막차 시각 확인", detail: "귀국이 9.8 밤 22:30 · T2↔장기주차장 02번 직통 · 막차 끊기면 택시 이동 (출국 전에 반드시 확인)", checked: false },
  { id: "prep-default-4d", label: "주차 정산용 신용카드 지참",     detail: "T1 장기주차장 무인정산기 카드 결제 · 4박 5일 예상 45,000원 안팎", checked: false },
  { id: "prep-default-4e", label: "하이패스 카드 탈거 여부 결정",   detail: "장기주차 5일간 차량 방치 · 탈거 권장", checked: false },
  { id: "prep-default-4b", label: "유심/이심 준비",               detail: "일본 eSIM 또는 로밍 · 2인 각각 · 출발 전 개통 확인", checked: false },
  { id: "prep-default-4c", label: "여행자 보험 가입",             detail: "일본 커버 · 9월 초 태풍 시즌이라 항공 지연/결항 보상 항목 확인", checked: false },
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
  // 배열이 명시돼 있으면 그대로 사용(빈 배열 = 사용자가 다 지운 것),
  // 없으면서 저장된 적도 없는 첫 로드일 때만 시드 제공
  const saved = r.version === 1;
  const packingSrc = r.packing || {};
  const seedPack = (arr, defaults) =>
    Array.isArray(arr) ? arr.map(sanitizePack).filter(Boolean)
      : (saved ? [] : defaults.map((d) => ({ ...d, checked: false })));
  const packing = {
    hyungin: seedPack(packingSrc.hyungin, DEFAULT_PACK_HYUNGIN),
    junga: seedPack(packingSrc.junga, DEFAULT_PACK_JUNGA)
  };
  let prep;
  if (Array.isArray(r.prep)) {
    prep = r.prep.map(sanitizePrep).filter(Boolean);
  } else if (saved) {
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

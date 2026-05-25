// Mock realistic Royal Thai Police organizational structure (~170 units)
//
// Real structure (simplified for demo):
//   ตร. (RTP HQ)
//   ├─ บช.น. (Metro Bureau)
//   │   ├─ บก.น.๑-๙ (9 metro divisions)
//   │   │   └─ สน.X (3-4 metro stations each)
//   │   └─ บก.จร., บก.สส.บช.น., บก.อก. (special metro divisions)
//   ├─ ตำรวจภูธรภาค ๑-๙ (9 regional bureaus)
//   │   └─ ภ.จว.X (3-4 provincial police per region)
//   │       └─ สภ.X (3-4 stations per province)
//   ├─ บช.พิเศษ (special bureaus): ปส., สอท., ก., ทท., ตชด.
//   └─ สยศ.ตร. (Strategy Office — demo project owner)

import type { OrgUnit } from "./types";

// ─────────────────────────────────────────────
// Level 0 — ตร.
// ─────────────────────────────────────────────
const RTP_HQ: OrgUnit = {
  id: "u-rtp",
  code: "ตร.",
  name: "สำนักงานตำรวจแห่งชาติ",
  shortName: "ตร.",
  kind: "RTP",
  level: 0,
  parentId: null,
  commanderTitle: "ผบ.ตร.",
  commanderName: "พล.ต.อ. กฤษฎา ภัทรประสิทธิ์",
  responsibilities: ["บริหารราชการตำรวจทั้งประเทศ"],
};

// ─────────────────────────────────────────────
// Level 1 — บช. (Bureau-level)
// ─────────────────────────────────────────────

// บช.น.
const BCH_NA: OrgUnit = {
  id: "u-bch-na",
  code: "บช.น.",
  name: "กองบัญชาการตำรวจนครบาล",
  shortName: "บช.น.",
  kind: "METRO_BUREAU",
  level: 1,
  parentId: RTP_HQ.id,
  region: "กรุงเทพมหานคร",
  commanderTitle: "ผบช.น.",
  commanderName: "พล.ต.ท. สุเมธ ตันติเวชกุล",
  responsibilities: ["ดูแลพื้นที่ กทม."],
};

// 9 ภาค
const REGIONS = [
  { num: "๑", id: "1", region: "ภาคกลาง",          name: "ตำรวจภูธรภาค ๑", commander: "พล.ต.ท. สมพงษ์ ชิงดวง" },
  { num: "๒", id: "2", region: "ภาคตะวันออก",       name: "ตำรวจภูธรภาค ๒", commander: "พล.ต.ท. ยิ่งยศ เทพจำนงค์" },
  { num: "๓", id: "3", region: "ภาคอีสานตอนล่าง",   name: "ตำรวจภูธรภาค ๓", commander: "พล.ต.ท. ธีรพล กาญจนสิงห์" },
  { num: "๔", id: "4", region: "ภาคอีสานตอนบน",     name: "ตำรวจภูธรภาค ๔", commander: "พล.ต.ท. ไกรบุญ ทรวดทรง" },
  { num: "๕", id: "5", region: "ภาคเหนือตอนบน",     name: "ตำรวจภูธรภาค ๕", commander: "พล.ต.ท. กิตติ์รัฐ พันธุ์เพ็ชร์" },
  { num: "๖", id: "6", region: "ภาคเหนือตอนล่าง",   name: "ตำรวจภูธรภาค ๖", commander: "พล.ต.ท. อภิชาติ บุญศรีโรจน์" },
  { num: "๗", id: "7", region: "ภาคตะวันตก",        name: "ตำรวจภูธรภาค ๗", commander: "พล.ต.ท. ธนายุตม์ วุฒิจรัสธำรงค์" },
  { num: "๘", id: "8", region: "ภาคใต้ตอนบน",       name: "ตำรวจภูธรภาค ๘", commander: "พล.ต.ท. สุรพงษ์ ถนอมจิตร" },
  { num: "๙", id: "9", region: "ภาคใต้ตอนล่าง",     name: "ตำรวจภูธรภาค ๙", commander: "พล.ต.ท. ปิยะวัฒน์ เฉลิมศรี" },
];

const REGIONAL_BUREAUS: OrgUnit[] = REGIONS.map((r) => ({
  id: `u-bch-${r.id}`,
  code: `ภ.${r.num}`,
  name: r.name,
  shortName: `ภ.${r.num}`,
  kind: "REGIONAL_BUREAU",
  level: 1,
  parentId: RTP_HQ.id,
  region: r.region,
  commanderTitle: `ผบช.ภาค ${r.num}`,
  commanderName: r.commander,
  responsibilities: [`ดูแลพื้นที่${r.region}`],
}));

// บช.พิเศษ
const SPECIAL_BUREAUS_DATA = [
  { code: "บช.ปส.",  name: "กองบัญชาการตำรวจปราบปรามยาเสพติด",       commander: "พล.ต.ท. คีรีศักดิ์ ตันตินวะชัย" },
  { code: "บช.สอท.", name: "กองบัญชาการตำรวจสืบสวนสอบสวนอาชญากรรมทางเทคโนโลยี", commander: "พล.ต.ท. วรวัฒน์ วัฒน์นครบัญชา" },
  { code: "บช.ก.",   name: "กองบัญชาการตำรวจสอบสวนกลาง",                commander: "พล.ต.ท. จิรภพ ภูริเดช" },
  { code: "บช.ทท.",  name: "กองบัญชาการตำรวจท่องเที่ยว",                commander: "พล.ต.ท. ศักย์ศิรา เผือกอ่ำ" },
  { code: "บช.ตชด.", name: "กองบัญชาการตำรวจตระเวนชายแดน",              commander: "พล.ต.ท. ยงเกียรติ มนปราณีต" },
];

const SPECIAL_BUREAUS: OrgUnit[] = SPECIAL_BUREAUS_DATA.map((b, idx) => ({
  id: `u-bch-special-${idx + 1}`,
  code: b.code,
  name: b.name,
  shortName: b.code,
  kind: "SPECIAL_BUREAU",
  level: 1,
  parentId: RTP_HQ.id,
  commanderTitle: `ผบช.${b.code.replace(/^บช\./, "")}`,
  commanderName: b.commander,
  responsibilities: [b.name],
}));

// สยศ.ตร. (project owner)
const SYS_TR: OrgUnit = {
  id: "u-bch-sys",
  code: "สยศ.ตร.",
  name: "สำนักงานยุทธศาสตร์ตำรวจ",
  shortName: "สยศ.ตร.",
  kind: "STAFF_BUREAU",
  level: 1,
  parentId: RTP_HQ.id,
  commanderTitle: "ผบช.สยศ.ตร.",
  commanderName: "พล.ต.ท. นิรันดร เหลื่อมศรี",
  responsibilities: ["ยุทธศาสตร์/แผน/ติดตามผลของ ตร."],
};

// ─────────────────────────────────────────────
// Level 2 — บก. and ภ.จว.
// ─────────────────────────────────────────────

// บก.น.๑-๙ (Metro Divisions)
const METRO_DIV_DATA = [
  { num: "๑", id: "1", area: "พระนคร / ดุสิต / ป้อมปราบ" },
  { num: "๒", id: "2", area: "ปทุมวัน / สาทร / บางรัก" },
  { num: "๓", id: "3", area: "บางซื่อ / จตุจักร / หลักสี่" },
  { num: "๔", id: "4", area: "ห้วยขวาง / ดินแดง / ราชเทวี" },
  { num: "๕", id: "5", area: "วัฒนา / คลองเตย / พระโขนง" },
  { num: "๖", id: "6", area: "สวนหลวง / ประเวศ / บางนา" },
  { num: "๗", id: "7", area: "บางพลัด / บางกอกน้อย / ตลิ่งชัน" },
  { num: "๘", id: "8", area: "ภาษีเจริญ / บางขุนเทียน / บางบอน" },
  { num: "๙", id: "9", area: "ทุ่งครุ / ราษฎร์บูรณะ / บางคอแหลม" },
];

const METRO_DIVISIONS: OrgUnit[] = METRO_DIV_DATA.map((d) => ({
  id: `u-bk-na-${d.id}`,
  code: `บก.น.${d.num}`,
  name: `กองบังคับการตำรวจนครบาล ${d.num}`,
  shortName: `บก.น.${d.num}`,
  kind: "METRO_DIVISION",
  level: 2,
  parentId: BCH_NA.id,
  region: "กรุงเทพมหานคร",
  commanderTitle: `ผบก.น.${d.num}`,
  responsibilities: [`พื้นที่ ${d.area}`],
}));

// บก. special under บช.น.
const METRO_SPECIAL_DIVS_DATA = [
  { code: "บก.จร.",     name: "กองบังคับการตำรวจจราจร" },
  { code: "บก.สส.บช.น.", name: "กองบังคับการสืบสวนสอบสวน บช.น." },
  { code: "บก.อก.บช.น.", name: "กองบังคับการอำนวยการ บช.น." },
];

const METRO_SPECIAL_DIVS: OrgUnit[] = METRO_SPECIAL_DIVS_DATA.map((d, idx) => ({
  id: `u-bk-na-sp-${idx + 1}`,
  code: d.code,
  name: d.name,
  shortName: d.code,
  kind: "SPECIAL_DIVISION",
  level: 2,
  parentId: BCH_NA.id,
  region: "กรุงเทพมหานคร",
  commanderTitle: `ผบก.${d.code.replace(/^บก\./, "")}`,
}));

// ภ.จว. (Provincial Police) under each ภาค
const PROVINCES_BY_REGION: Record<string, { name: string; abbr: string }[]> = {
  "1": [
    { name: "นนทบุรี", abbr: "นบ" },
    { name: "ปทุมธานี", abbr: "ปท" },
    { name: "พระนครศรีอยุธยา", abbr: "อย" },
    { name: "สระบุรี", abbr: "สบ" },
  ],
  "2": [
    { name: "ชลบุรี", abbr: "ชบ" },
    { name: "ระยอง", abbr: "รย" },
    { name: "ฉะเชิงเทรา", abbr: "ฉช" },
    { name: "ปราจีนบุรี", abbr: "ปจ" },
  ],
  "3": [
    { name: "นครราชสีมา", abbr: "นม" },
    { name: "บุรีรัมย์", abbr: "บร" },
    { name: "สุรินทร์", abbr: "สร" },
    { name: "อุบลราชธานี", abbr: "อบ" },
  ],
  "4": [
    { name: "ขอนแก่น", abbr: "ขก" },
    { name: "อุดรธานี", abbr: "อด" },
    { name: "หนองคาย", abbr: "นค" },
    { name: "เลย", abbr: "ลย" },
  ],
  "5": [
    { name: "เชียงใหม่", abbr: "ชม" },
    { name: "เชียงราย", abbr: "ชร" },
    { name: "ลำปาง", abbr: "ลป" },
    { name: "ลำพูน", abbr: "ลพ" },
  ],
  "6": [
    { name: "พิษณุโลก", abbr: "พล" },
    { name: "สุโขทัย", abbr: "สท" },
    { name: "นครสวรรค์", abbr: "นว" },
    { name: "พิจิตร", abbr: "พจ" },
  ],
  "7": [
    { name: "นครปฐม", abbr: "นฐ" },
    { name: "ราชบุรี", abbr: "รบ" },
    { name: "กาญจนบุรี", abbr: "กจ" },
    { name: "เพชรบุรี", abbr: "พบ" },
  ],
  "8": [
    { name: "สุราษฎร์ธานี", abbr: "สฎ" },
    { name: "นครศรีธรรมราช", abbr: "นศ" },
    { name: "ภูเก็ต", abbr: "ภก" },
    { name: "กระบี่", abbr: "กบ" },
  ],
  "9": [
    { name: "สงขลา", abbr: "สข" },
    { name: "ปัตตานี", abbr: "ปน" },
    { name: "ยะลา", abbr: "ยล" },
    { name: "นราธิวาส", abbr: "นธ" },
  ],
};

const PROVINCIAL_POLICE: OrgUnit[] = [];
for (const region of REGIONS) {
  const provinces = PROVINCES_BY_REGION[region.id] ?? [];
  for (const p of provinces) {
    PROVINCIAL_POLICE.push({
      id: `u-prov-${region.id}-${p.abbr}`,
      code: `ภ.จว.${p.name}`,
      name: `ตำรวจภูธรจังหวัด${p.name}`,
      shortName: `ภ.จว.${p.name}`,
      kind: "PROVINCIAL_POLICE",
      level: 2,
      parentId: `u-bch-${region.id}`,
      region: region.region,
      province: p.name,
      commanderTitle: `ผบก.ภ.จว.${p.name}`,
    });
  }
}

// บก. special under บช.พิเศษ (just a few — to show structure)
const SPECIAL_DIVISIONS_UNDER_SPECIAL_BUREAUS: OrgUnit[] = [
  // Under บช.ปส.
  { id: "u-bk-ps-1", code: "บก.ปส.๑", name: "กองบังคับการตำรวจปราบปรามยาเสพติด ๑", shortName: "บก.ปส.๑", kind: "SPECIAL_DIVISION", level: 2, parentId: "u-bch-special-1", commanderTitle: "ผบก.ปส.๑" },
  { id: "u-bk-ps-2", code: "บก.ปส.๒", name: "กองบังคับการตำรวจปราบปรามยาเสพติด ๒", shortName: "บก.ปส.๒", kind: "SPECIAL_DIVISION", level: 2, parentId: "u-bch-special-1", commanderTitle: "ผบก.ปส.๒" },
  // Under บช.สอท.
  { id: "u-bk-sot-1", code: "บก.สอท.๑", name: "กองบังคับการตำรวจสืบสวนอาชญากรรมทางเทคโนโลยี ๑", shortName: "บก.สอท.๑", kind: "SPECIAL_DIVISION", level: 2, parentId: "u-bch-special-2", commanderTitle: "ผบก.สอท.๑" },
  { id: "u-bk-sot-2", code: "บก.สอท.๒", name: "กองบังคับการตำรวจสืบสวนอาชญากรรมทางเทคโนโลยี ๒", shortName: "บก.สอท.๒", kind: "SPECIAL_DIVISION", level: 2, parentId: "u-bch-special-2", commanderTitle: "ผบก.สอท.๒" },
  // Under บช.ก.
  { id: "u-bk-k-p", code: "บก.ป.", name: "กองบังคับการตำรวจสันติบาล", shortName: "บก.ป.", kind: "SPECIAL_DIVISION", level: 2, parentId: "u-bch-special-3", commanderTitle: "ผบก.ป." },
  { id: "u-bk-k-pp", code: "บก.ปคบ.", name: "กองบังคับการปราบปรามการกระทำผิดเกี่ยวกับการคุ้มครองผู้บริโภค", shortName: "บก.ปคบ.", kind: "SPECIAL_DIVISION", level: 2, parentId: "u-bch-special-3", commanderTitle: "ผบก.ปคบ." },
];

// ─────────────────────────────────────────────
// Level 3 — สน. / สภ.
// ─────────────────────────────────────────────

// สน. (Metro Stations) — 3 per บก.น. group of areas
const METRO_STATIONS_DATA: Record<string, string[]> = {
  "1": ["สน.พระราชวัง", "สน.ชนะสงคราม", "สน.สำราญราษฎร์"],
  "2": ["สน.ปทุมวัน", "สน.บางรัก", "สน.ลุมพินี", "สน.ทุ่งมหาเมฆ"],
  "3": ["สน.บางซื่อ", "สน.พหลโยธิน", "สน.บางเขน"],
  "4": ["สน.ห้วยขวาง", "สน.ดินแดง", "สน.มักกะสัน", "สน.พญาไท"],
  "5": ["สน.ทองหล่อ", "สน.พระโขนง", "สน.คลองตัน", "สน.บางนา"],
  "6": ["สน.อุดมสุข", "สน.ประเวศ", "สน.หัวหมาก"],
  "7": ["สน.บางพลัด", "สน.บางกอกน้อย", "สน.ตลิ่งชัน"],
  "8": ["สน.ภาษีเจริญ", "สน.บางขุนเทียน", "สน.หนองแขม"],
  "9": ["สน.ทุ่งครุ", "สน.ราษฎร์บูรณะ", "สน.บางคอแหลม"],
};

const METRO_STATIONS: OrgUnit[] = [];
for (const div of METRO_DIVISIONS) {
  const divNum = div.id.replace("u-bk-na-", "");
  const stations = METRO_STATIONS_DATA[divNum] ?? [];
  stations.forEach((stName) => {
    METRO_STATIONS.push({
      id: `u-sn-${divNum}-${METRO_STATIONS.length + 1}`,
      code: stName,
      name: `สถานีตำรวจนครบาล${stName.replace(/^สน\./, "")}`,
      shortName: stName,
      kind: "METRO_STATION",
      level: 3,
      parentId: div.id,
      region: "กรุงเทพมหานคร",
      commanderTitle: `ผกก.${stName}`,
    });
  });
}

// สภ. (Provincial Stations) — 3 per ภ.จว.
const PROV_STATIONS_DATA: Record<string, string[]> = {
  // ภาค 1
  "นนทบุรี": ["สภ.เมืองนนทบุรี", "สภ.ปากเกร็ด", "สภ.บางใหญ่"],
  "ปทุมธานี": ["สภ.เมืองปทุมธานี", "สภ.คลองหลวง", "สภ.ธัญบุรี"],
  "พระนครศรีอยุธยา": ["สภ.อยุธยา", "สภ.บางปะอิน", "สภ.วังน้อย"],
  "สระบุรี": ["สภ.เมืองสระบุรี", "สภ.หนองแค", "สภ.มวกเหล็ก"],
  // ภาค 2
  "ชลบุรี": ["สภ.เมืองชลบุรี", "สภ.พัทยา", "สภ.ศรีราชา", "สภ.บางละมุง"],
  "ระยอง": ["สภ.เมืองระยอง", "สภ.บ้านฉาง", "สภ.มาบตาพุด"],
  "ฉะเชิงเทรา": ["สภ.เมืองฉะเชิงเทรา", "สภ.บางคล้า"],
  "ปราจีนบุรี": ["สภ.เมืองปราจีนบุรี", "สภ.กบินทร์บุรี"],
  // ภาค 3
  "นครราชสีมา": ["สภ.เมืองนครราชสีมา", "สภ.ปากช่อง", "สภ.โชคชัย"],
  "บุรีรัมย์": ["สภ.เมืองบุรีรัมย์", "สภ.นางรอง"],
  "สุรินทร์": ["สภ.เมืองสุรินทร์", "สภ.ชุมพลบุรี"],
  "อุบลราชธานี": ["สภ.เมืองอุบลฯ", "สภ.วารินชำราบ", "สภ.พิบูลมังสาหาร"],
  // ภาค 4
  "ขอนแก่น": ["สภ.เมืองขอนแก่น", "สภ.บ้านไผ่", "สภ.ชุมแพ"],
  "อุดรธานี": ["สภ.เมืองอุดรธานี", "สภ.กุมภวาปี"],
  "หนองคาย": ["สภ.เมืองหนองคาย", "สภ.ท่าบ่อ"],
  "เลย": ["สภ.เมืองเลย", "สภ.วังสะพุง"],
  // ภาค 5
  "เชียงใหม่": ["สภ.เมืองเชียงใหม่", "สภ.ภูพิงค์ราชนิเวศน์", "สภ.สันทราย", "สภ.หางดง"],
  "เชียงราย": ["สภ.เมืองเชียงราย", "สภ.แม่สาย", "สภ.เชียงแสน"],
  "ลำปาง": ["สภ.เมืองลำปาง", "สภ.เถิน"],
  "ลำพูน": ["สภ.เมืองลำพูน", "สภ.บ้านธิ"],
  // ภาค 6
  "พิษณุโลก": ["สภ.เมืองพิษณุโลก", "สภ.วังทอง"],
  "สุโขทัย": ["สภ.เมืองสุโขทัย", "สภ.ศรีสำโรง"],
  "นครสวรรค์": ["สภ.เมืองนครสวรรค์", "สภ.ตาคลี"],
  "พิจิตร": ["สภ.เมืองพิจิตร", "สภ.ตะพานหิน"],
  // ภาค 7
  "นครปฐม": ["สภ.เมืองนครปฐม", "สภ.สามพราน", "สภ.นครชัยศรี"],
  "ราชบุรี": ["สภ.เมืองราชบุรี", "สภ.บ้านโป่ง"],
  "กาญจนบุรี": ["สภ.เมืองกาญจนบุรี", "สภ.ท่ามะกา"],
  "เพชรบุรี": ["สภ.เมืองเพชรบุรี", "สภ.ชะอำ"],
  // ภาค 8
  "สุราษฎร์ธานี": ["สภ.เมืองสุราษฎร์ฯ", "สภ.เกาะสมุย", "สภ.เกาะพะงัน"],
  "นครศรีธรรมราช": ["สภ.เมืองนครศรีฯ", "สภ.ทุ่งสง", "สภ.ปากพนัง"],
  "ภูเก็ต": ["สภ.เมืองภูเก็ต", "สภ.ป่าตอง", "สภ.กะรน", "สภ.ฉลอง"],
  "กระบี่": ["สภ.เมืองกระบี่", "สภ.อ่าวลึก"],
  // ภาค 9
  "สงขลา": ["สภ.เมืองสงขลา", "สภ.หาดใหญ่", "สภ.สะเดา"],
  "ปัตตานี": ["สภ.เมืองปัตตานี", "สภ.หนองจิก"],
  "ยะลา": ["สภ.เมืองยะลา", "สภ.เบตง"],
  "นราธิวาส": ["สภ.เมืองนราธิวาส", "สภ.สุไหงโก-ลก", "สภ.ตากใบ"],
};

const PROVINCIAL_STATIONS: OrgUnit[] = [];
for (const prov of PROVINCIAL_POLICE) {
  const stations = PROV_STATIONS_DATA[prov.province!] ?? [];
  stations.forEach((stName, idx) => {
    PROVINCIAL_STATIONS.push({
      id: `${prov.id}-st-${idx + 1}`,
      code: stName,
      name: stName.replace(/^สภ\./, "สถานีตำรวจภูธร"),
      shortName: stName,
      kind: "PROVINCIAL_STATION",
      level: 3,
      parentId: prov.id,
      region: prov.region,
      province: prov.province,
      commanderTitle: `ผกก.${stName}`,
    });
  });
}

// ─────────────────────────────────────────────
// Level 4 — งาน/ฝ่าย (Functional Divisions inside each station)
// ─────────────────────────────────────────────

const STATION_DIV_TEMPLATES = [
  { abbr: "สส", code: "งสส.", name: "งานสืบสวน", commanderTitle: "รอง ผกก.(สส.)" },
  { abbr: "สอ", code: "งสอ.", name: "งานสอบสวน", commanderTitle: "รอง ผกก.(สอ.)" },
  { abbr: "ปป", code: "งปป.", name: "งานป้องกันปราบปราม", commanderTitle: "รอง ผกก.(ปป.)" },
  { abbr: "จร", code: "งจร.", name: "งานจราจร", commanderTitle: "รอง ผกก.(จร.)" },
];

const STATION_DIVISIONS: OrgUnit[] = [];
for (const station of [...METRO_STATIONS, ...PROVINCIAL_STATIONS]) {
  for (const div of STATION_DIV_TEMPLATES) {
    STATION_DIVISIONS.push({
      id: `${station.id}-${div.abbr}`,
      code: div.code,
      name: `${div.name} ${station.shortName ?? station.code}`,
      shortName: `${div.code}${station.shortName ?? station.code}`,
      kind: "STATION_DIVISION",
      level: 4,
      parentId: station.id,
      region: station.region,
      province: station.province,
      commanderTitle: div.commanderTitle,
    });
  }
}

// ─────────────────────────────────────────────
// Final exported list
// ─────────────────────────────────────────────

export const ALL_UNITS: OrgUnit[] = [
  RTP_HQ,
  // L1
  BCH_NA,
  ...REGIONAL_BUREAUS,
  ...SPECIAL_BUREAUS,
  SYS_TR,
  // L2
  ...METRO_DIVISIONS,
  ...METRO_SPECIAL_DIVS,
  ...PROVINCIAL_POLICE,
  ...SPECIAL_DIVISIONS_UNDER_SPECIAL_BUREAUS,
  // L3
  ...METRO_STATIONS,
  ...PROVINCIAL_STATIONS,
  // L4
  ...STATION_DIVISIONS,
];

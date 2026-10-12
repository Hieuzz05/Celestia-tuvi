# Baseline P0 — `6d7292c` (05/10/2026)

Bản thô bất biến (input, output, full offline trace — có văn trả lời nên KHÔNG commit):
`D:\Celestia\eval\p0\baseline-6d7292c-2026-10-05T13-46-08-849Z\` (manifest.json, ca/, tong.json, chan-doan/).

## Đóng băng

| Mục | Giá trị |
|---|---|
| Git | `6d7292c233ec49a2256afb1e710722561c859c14`, cây sạch |
| Model ghim | `openai|gpt-5.6-luna` (giá $0.2 / $1.2 mỗi triệu token, trần $2) |
| Chuỗi Production (đọc DB lúc chạy) | openai gpt-5.6-luna → gemini-3.6-flash → groq gpt-oss-120b → cerebras gpt-oss-120b → openai gpt-4o-mini |
| Tham số viết | maxTokens 6000, không temperature, không seed; viết lại tối đa 1; hạn lượt 50 s |
| Cờ | `CELES_FOCUSED_CHAT=1` (ép trong harness), `CELES_OWNER_KNOWLEDGE_FOCUSED` không đặt, `AI_NHAN=test` |
| Phiên bản | planner 2026.10.4 · truy hồi 2026.09.4 · schema 1.4 · focused-2026.10.15 · engine celestia-nam-phai@2026.09.2 · ngôn ngữ 2026.09.7 |
| Ngày cố định | 2026-10-04 (âm 24/8/2026) |
| Bộ ca | `eval/p0/bo-ca-v1.json` · p0-bo-ca-v1 · sha256 `7695e269…8568` · 20 PILOT + 30 HOLDOUT |
| Kho | 15 bản xuất bản, 7559 chunk, vân tay `3c1147b829bbd01a` |
| Ghi DB | không ghi retrieval_runs / ai_requests |

## Kết quả (chẩn đoán tất định, chưa nhãn judge / người — là SÀN)

| Tầng | PILOT | HOLDOUT |
|---|---|---|
| PLANNING_ERROR | 2 (P08, P15) | 5 (H12, H13, H22, H23, H24) |
| SELECTION_MISS | 2 (P03, P09) | 0 |
| WRITING_MISS | 0 | 1 (H21: 502, CHAC_CHAN_GIA hai lần) |
| ENGINE / KNOWLEDGE / RETRIEVAL | 0 | 0 |
| NO_ERROR_FOUND | 16 | 24 |

Cắt ngang: ANSWER_OFF_TARGET 2 (H11, P08 — ca EN có chữ Việt). Cờ: NOT_YET_VERIFIABLE 7, INPUT_UNCERTAIN 1.

Vận hành: 60 lượt / 52 tới model · 502 1.7% · viết lại 9.6% · ngoại lệ 0 · p50 12.2 s · p95 19.7 s ·
token vào/ra TB 9559 / 695 · $0.1435.

Planning: H22/H23/H24 là timeIntent next-year / current-month / near-future bị đọc thành năm hiện tại;
P15 current-year ra 2025 — đúng vùng CEL-191 sửa.

## Ghi chú đo

- `daChonIds` trong vết baseline trống (lỗi harness, đã sửa sau khi chạy); `ungVien[].duocChon` đủ, chẩn đoán dùng trường này.
- `metaChoHoiLai` xấp xỉ bằng `coMeta` (đánh dấu "meta xấp xỉ" trong báo cáo).
- Nhãn `model_embedding` trong DB ghi gemini nhưng vector là OpenAI text-embedding-3-small (cosine 1.0000) — nhãn sai, truy hồi không lệch.
- Kỳ vọng từng ca là PROPOSED, chờ chủ dự án chấm.

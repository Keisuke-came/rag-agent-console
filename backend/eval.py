#!/usr/bin/env python3
"""eval_questions.json を回して CSV に集計する簡易評価スクリプト."""
import json, csv, os, time, sys
from rag.chain import ask

EVAL_PATH = os.path.join(os.path.dirname(__file__), "eval", "eval_questions.json")
OUTPUT_CSV = os.path.join(os.path.dirname(__file__), "eval", "eval_results.csv")

def main():
    with open(EVAL_PATH, encoding="utf-8") as f:
        questions = json.load(f)

    rows = []
    print(f"🧪 {len(questions)} 問を評価中...\n")

    for i, q in enumerate(questions, 1):
        query = q["question"]
        expected = q.get("expected_keywords", [])
        print(f"[{i}/{len(questions)}] {query}")

        t0 = time.time()
        result = ask(query)
        elapsed = time.time() - t0
        answer = result["answer"]

        # keyword hit rate
        hits = sum(1 for kw in expected if kw in answer)
        kw_rate = hits / len(expected) if expected else 0.0

        # has citation?
        has_citation = "[出典:" in answer or "出典:" in answer

        # not "見つかりませんでした" = answered
        answered = "見つかりませんでした" not in answer

        sources = ", ".join(h["source"] for h in result["hits"])

        row = {
            "question": query,
            "answered": answered,
            "has_citation": has_citation,
            "keyword_hit_rate": f"{kw_rate:.2f}",
            "latency_sec": f"{elapsed:.2f}",
            "sources": sources,
            "answer_preview": answer[:120].replace("\n", " "),
        }
        rows.append(row)
        print(f"   → answered={answered}, citation={has_citation}, kw={kw_rate:.0%}, {elapsed:.1f}s")

    # Write CSV
    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)

    # Summary
    total = len(rows)
    answered_count = sum(1 for r in rows if r["answered"])
    citation_count = sum(1 for r in rows if r["has_citation"])
    avg_kw = sum(float(r["keyword_hit_rate"]) for r in rows) / total
    avg_latency = sum(float(r["latency_sec"]) for r in rows) / total

    print(f"\n{'='*50}")
    print(f"📊 評価結果サマリ ({total} 問)")
    print(f"   回答率:     {answered_count}/{total} ({answered_count/total:.0%})")
    print(f"   引用率:     {citation_count}/{total} ({citation_count/total:.0%})")
    print(f"   KWヒット率:  {avg_kw:.0%}")
    print(f"   平均レイテンシ: {avg_latency:.1f}s")
    print(f"   CSV保存先:  {OUTPUT_CSV}")

if __name__ == "__main__":
    main()

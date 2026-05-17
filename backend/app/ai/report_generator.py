from openai import OpenAI
from dotenv import load_dotenv
import os

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def generate_report(trades: list, principles: list, period: str) -> str:
    if not trades:
        return "이 기간에 매매 기록이 없습니다."

    trades_text = "\n".join([
        f"- [{t['direction'].upper()}] {t['ticker']} {t['quantity']}주 @ {t['price']}원 "
        f"| 이유: {t.get('reason', '미기록')} "
        f"| 감정: {t.get('emotion_tag', '미기록')} "
        f"| 결과: {t.get('outcome', '보유중')}"
        for t in trades
    ])

    principles_text = "\n".join([
        f"- [{p['category']}] {p['title']}: {p.get('content', '')}"
        for p in principles if p.get('is_active')
    ]) or "등록된 투자 원칙 없음"

    prompt = f"""당신은 개인 투자 습관 코치입니다. 아래 매매 기록과 투자 원칙을 분석해서 피드백을 제공해주세요.

## 기간
{period}

## 나의 투자 원칙
{principles_text}

## 매매 기록
{trades_text}

## 분석 요청
다음 항목으로 구체적이고 솔직하게 피드백해주세요:

1. **원칙 준수율** — 각 거래가 투자 원칙을 지켰는지 분석
2. **감정 패턴** — 감정 태그별 거래 패턴과 문제점
3. **잘한 점** — 원칙을 잘 지킨 거래 하이라이트
4. **개선할 점** — 반복되는 나쁜 습관과 구체적 개선 방법 2~3가지
5. **다음 기간 목표** — 실천 가능한 구체적 액션 아이템

따뜻하지만 솔직하게, 투자 멘토처럼 말해주세요. 한국어로 작성해주세요."""

    response = client.chat.completions.create(
        model="gpt-4o",
        max_tokens=1500,
        messages=[{"role": "user", "content": prompt}]
    )

    return response.choices[0].message.content
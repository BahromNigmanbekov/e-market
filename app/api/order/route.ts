import { NextRequest, NextResponse } from "next/server";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title, size, quantity, unitPrice, totalPrice, currency } = body;

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.error("TELEGRAM_BOT_TOKEN yoki TELEGRAM_CHAT_ID .env.local da topilmadi");
      return NextResponse.json(
        { error: "Telegram sozlamalari to'ldirilmagan" },
        { status: 500 }
      );
    }

    const text =
      `🛒 <b>Yangi buyurtma</b>\n\n` +
      `🆔 ID: <code>${id}</code>\n` +
      `👕 Mahsulot: <b>${title}</b>\n` +
      (size ? `📏 O'lcham: ${size}\n` : "") +
      `🔢 Miqdor: ${quantity}\n` +
      `💵 Narxi: ${currency}${unitPrice}\n` +
      `💰 Jami: <b>${currency}${totalPrice}</b>\n` +
      `🕒 Vaqt: ${new Date().toLocaleString("uz-UZ")}`;

    const tgRes = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text,
          parse_mode: "HTML",
        }),
      }
    );

    if (!tgRes.ok) {
      const errData = await tgRes.text();
      console.error("Telegram API xatolik:", errData);
      return NextResponse.json(
        { error: "Telegramga yuborib bo'lmadi", details: errData },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Order route xatolik:", err);
    return NextResponse.json(
      { error: "Serverda xatolik yuz berdi" },
      { status: 500 }
    );
  }
}
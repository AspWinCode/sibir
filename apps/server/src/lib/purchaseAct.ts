import PDFDocument from "pdfkit";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

type PurchaseActData = {
  number: number;
  date: Date;
  buyer: string;
  buyerAddress: string;
  buyerInn?: string | null;
  seller: string;
  sellerPhone: string;
  sellerAddress?: string | null;
  sellerPassport?: string | null;
  material: string;
  quantityKg: number;
  pricePerKg: number;
  amount: number;
};

export async function createPurchaseActPdf(data: PurchaseActData): Promise<Buffer> {
  const font = await readFile(findFontPath());
  const document = new PDFDocument({ size: "A4", margin: 52 });
  const chunks: Buffer[] = [];

  document.registerFont("NotoSans", font);
  document.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
  document.font("NotoSans").fillColor("#000");

  document.fontSize(10).text("Утверждаю");
  document.text(data.buyer || "Наименование заготовителя");
  document.text(`Дата утверждения: ${formatDate(data.date)}`);
  document.moveDown(1.25);
  document.fontSize(15).text(`ЗАКУПОЧНЫЙ АКТ № ${data.number}`, { align: "center" });
  document.moveDown(0.35);
  document.fontSize(9.5).text(`Дата: ${formatDate(data.date)}    Адрес заготовителя: ${data.buyerAddress || "не указан"}`);
  document.moveDown(0.8);
  document.fontSize(9.5).text(`Покупатель ${data.buyer || "Наименование заготовителя"}, действующий на основании свидетельства о регистрации № не указан, ИНН ${data.buyerInn || "не указан"}.`, { lineGap: 2 });
  document.text(`Продавец ${data.seller || "ФИО сборщика"}, зарегистрированный по адресу: ${data.sellerAddress || "не указан"}.`, { lineGap: 2 });
  document.text(`Паспорт: ${data.sellerPassport || "серия, номер и кем выдан не указаны"}.`, { lineGap: 2 });
  document.text(`Телефон: ${data.sellerPhone || "не указан"}.`, { lineGap: 2 });
  document.moveDown(0.65);
  document.text("Составили настоящий закупочный акт о нижеследующем:", { lineGap: 2 });
  document.moveDown(0.35);
  document.text(`Покупатель приобрел у Продавца следующий товар на общую сумму ${amountInWords(data.amount)}.`, { lineGap: 2 });
  document.moveDown(0.5);

  const left = document.page.margins.left;
  const widths = [28, 78, 86, 74, 66, 43, 52, 56];
  const headers = ["№п/п", "Наименование", "Латинское наименование", "Место сбора", "Единица измерения", "Кол-во", "Цена руб", "Сумма руб"];
  const rowHeight = 36;
  drawTable(document, left, document.y, widths, [headers, ["1", data.material, "не указано", "не указано", "кг", formatQuantity(data.quantityKg), money(data.pricePerKg), money(data.amount)], ["Итого", "", "", "", "", "", "", money(data.amount)]], rowHeight);
  document.x = left;
  document.y += rowHeight * 3 + 8;
  document.text("Продавец передал Покупателю товары, указанные в пункте 1 Закупочного акта. Претензий к их состоянию Покупатель не имеет.", { lineGap: 2 });
  document.moveDown(0.45);
  document.text(`Продавец получил денежные средства в размере ${amountInWords(data.amount)} за проданные Покупателю товары, указанные в пункте 1 Закупочного акта.`, { lineGap: 2 });
  document.moveDown(0.45);
  document.text("Сумма дохода не подлежит налогообложению на основании ст. 217 п. 15 НК РФ.", { lineGap: 2 });
  document.moveDown(1.2);
  document.fontSize(10).text("ПОДПИСИ СТОРОН:");
  document.moveDown(0.7);
  document.fontSize(9.5).text("Покупатель: ____________________ / ____________________ /");
  document.moveDown(0.75);
  document.text("Продавец:   ____________________ / ____________________ /");

  document.end();
  await new Promise<void>((resolve) => document.on("end", resolve));
  return Buffer.concat(chunks);
}

function findFontPath() {
  const candidates = [
    process.env.PURCHASE_ACT_FONT_PATH,
    path.resolve(process.cwd(), "apps/server/assets/NotoSans-Regular.ttf"),
    path.resolve(process.cwd(), "assets/NotoSans-Regular.ttf"),
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../assets/NotoSans-Regular.ttf"),
  ].filter((value): value is string => Boolean(value));
  const result = candidates.find((value) => existsSync(value));
  if (!result) throw new Error("Шрифт для закупочного акта не найден");
  return result;
}

function drawTable(document: PDFKit.PDFDocument, x: number, y: number, widths: number[], rows: string[][], rowHeight: number) {
  rows.forEach((row, rowIndex) => {
    if (rowIndex === 2) {
      const mergedWidth = widths.slice(0, -1).reduce((sum, width) => sum + width, 0);
      document.rect(x, y + rowIndex * rowHeight, mergedWidth, rowHeight).fillAndStroke("#ffffff", "#999999");
      document.fillColor("#000").font("NotoSans").fontSize(7.8).text("Итого", x + 5, y + rowIndex * rowHeight + 12, { width: mergedWidth - 10 });
      document.rect(x + mergedWidth, y + rowIndex * rowHeight, widths[widths.length - 1], rowHeight).fillAndStroke("#ffffff", "#999999");
      document.fillColor("#000").font("NotoSans").fontSize(7.8).text(row[row.length - 1], x + mergedWidth + 3, y + rowIndex * rowHeight + 12, { width: widths[widths.length - 1] - 6, align: "center" });
      return;
    }
    let offset = x;
    row.forEach((value, columnIndex) => {
      const width = widths[columnIndex];
      document.rect(offset, y + rowIndex * rowHeight, width, rowHeight).fillAndStroke(rowIndex === 0 ? "#eeeeee" : "#ffffff", "#999999");
      document.fillColor("#000").font("NotoSans").fontSize(rowIndex === 0 ? 6.8 : 7.8).text(value, offset + 3, y + rowIndex * rowHeight + 4, {
        width: width - 6,
        height: rowHeight - 8,
        align: columnIndex === 0 || columnIndex >= 4 ? "center" : "left",
        lineGap: 0,
      });
      offset += width;
    });
  });
}

function formatDate(date: Date) { return date.toLocaleDateString("ru-RU"); }
function formatQuantity(value: number) { return value.toLocaleString("ru-RU", { maximumFractionDigits: 2 }); }
function money(value: number) { return value.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

function amountInWords(value: number) {
  const rubles = Math.floor(value);
  const kopecks = Math.round((value - rubles) * 100);
  return `${integerInWords(rubles)} рублей ${String(kopecks).padStart(2, "0")} копеек`;
}

function integerInWords(value: number): string {
  if (value === 0) return "ноль";
  const ones = ["", "один", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"];
  const teens = ["десять", "одиннадцать", "двенадцать", "тринадцать", "четырнадцать", "пятнадцать", "шестнадцать", "семнадцать", "восемнадцать", "девятнадцать"];
  const tens = ["", "", "двадцать", "тридцать", "сорок", "пятьдесят", "шестьдесят", "семьдесят", "восемьдесят", "девяносто"];
  const hundreds = ["", "сто", "двести", "триста", "четыреста", "пятьсот", "шестьсот", "семьсот", "восемьсот", "девятьсот"];
  if (value >= 1_000_000) return `${integerInWords(Math.floor(value / 1_000_000))} миллионов ${integerInWords(value % 1_000_000)}`;
  if (value >= 1000) return `${integerInWords(Math.floor(value / 1000))} тысяч ${integerInWords(value % 1000)}`.trim();
  if (value >= 100) return `${hundreds[Math.floor(value / 100)]} ${integerInWords(value % 100)}`.trim();
  if (value >= 20) return `${tens[Math.floor(value / 10)]} ${ones[value % 10]}`.trim();
  if (value >= 10) return teens[value - 10];
  return ones[value];
}

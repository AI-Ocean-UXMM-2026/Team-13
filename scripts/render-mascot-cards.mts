// Rebuild static, non-personalized share cards: npm run mascots:render
import { chromium } from "@playwright/test";
import { readFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { mascotCatalog } from "../src/lib/frontend/result-mascots";

const root = new URL("../", import.meta.url);
const font = (
  await readFile(new URL("public/fonts/NotoSansMyanmar.ttf", root))
).toString("base64");
const output = new URL("public/mascots/results/cards/", root);
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1080, height: 1080 },
    deviceScaleFactor: 1,
  });
  for (const mascot of mascotCatalog) {
    const image = (
      await readFile(new URL(`public/mascots/results/${mascot.id}.webp`, root))
    ).toString("base64");
    await page.setContent(`<!doctype html><html lang="en"><meta charset="utf-8"><style>
      @font-face{font-family:Myanmar;src:url(data:font/ttf;base64,${font}) format('truetype');font-weight:100 900}
      *{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;color:#203d35}
      .card{width:1080px;height:1080px;position:relative;overflow:hidden;background:linear-gradient(145deg,${mascot.tint},#fffaf0);padding:52px 64px;text-align:center}
      .ring{position:absolute;width:630px;height:630px;border-radius:50%;border:1px solid ${mascot.color}22;top:65px;left:225px}
      .ring:after{content:'';position:absolute;inset:35px;border-radius:50%;background:#ffffff7a}
      .brand{position:relative;text-align:left;font-size:25px;font-weight:700;letter-spacing:-1px}.brand span{float:right;font-size:14px;letter-spacing:2px;color:${mascot.color};line-height:30px}
      img{position:relative;display:block;width:520px;height:520px;object-fit:contain;margin:6px auto 10px}
      .title{position:relative;margin:0 0 12px;font-size:20px;letter-spacing:2px;text-transform:uppercase;color:${mascot.color};font-weight:700}
      h1{position:relative;font-size:66px;letter-spacing:-2px;line-height:1.1;margin:0}
      .my{font-family:Myanmar,sans-serif;font-size:34px;line-height:1.9;margin:2px 0 6px}
      .tagline{font-family:Georgia,serif;font-style:italic;font-size:30px;margin:0;color:${mascot.color}}
      .footer{position:absolute;bottom:52px;left:64px;right:64px;border-top:1px solid #203d3526;padding-top:22px;font-size:17px;color:#596d63}
    </style><div class="card"><div class="ring"></div><div class="brand">✧ Wayfinder<span>MY EXPLORATION COMPANION</span></div>
    <img src="data:image/webp;base64,${image}" alt=""><p class="title">${mascot.title}</p><h1>${mascot.name}</h1><p class="my" lang="my">${mascot.burmeseName}</p><p class="tagline">${mascot.tagline}.</p><p class="footer">A playful companion for career exploration.</p></div></html>`);
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map((image) => image.decode()));
    });
    if (
      await page
        .locator(".tagline")
        .evaluate((node) => node.scrollWidth > node.clientWidth)
    )
      throw Error(`Card text overflow: ${mascot.id}`);
    await page.screenshot({
      path: fileURLToPath(new URL(`${mascot.id}.png`, output)),
      animations: "disabled",
    });
    console.log(`Rendered ${mascot.id}: 1080×1080`);
  }
} finally {
  await browser.close();
}

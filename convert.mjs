import { ImagePool } from "@squoosh/lib";
import { existsSync, readFileSync, mkdirSync } from "fs";
import { writeFile } from "fs/promises";
import { dirname } from "path";

import showFiles from "./showFiles.mjs";

const IMAGE_DIR = "./images";
const OUTPUT_DIR = "./dist";

// WebPの圧縮オプション
const webpEncodeOptions = {
  webp: {
    quality: 75,
  },
};

const imagePool = new ImagePool();

// 画像ディレクトリ内のJPGとPNGのパス名を抽出
const imageFileList = [];
await showFiles(IMAGE_DIR, (fp) => {
  const regex = /\.(jpe?g|png)$/i;
  if (regex.test(fp)) {
    imageFileList.push(fp);
  }
});

// 抽出したファイルをimagePool内にセットし、ファイル名とimagePoolの配列を作成
const imagePoolList = imageFileList.map((file) => {
  const imageFile = readFileSync(`${file}`);
  const image = imagePool.ingestImage(imageFile);

  return {
    name: file.replace(IMAGE_DIR.replace("./", ""), ""),
    image,
  };
});

// Webpで圧縮する
await Promise.all(
  imagePoolList.map(async (item) => {
    const { image } = item;
    await image.encode(webpEncodeOptions);
  })
);

// 圧縮したデータを出力する
for (const item of imagePoolList) {
  const {
    name,
    image: { encodedWith },
  } = item;

  // WebPで圧縮したデータを取得
  const data = await encodedWith.webp;
  // 出力先フォルダがなければ作成
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR);
  }
  // 拡張子をwebpに変換してファイルを書き込む
  mkdirSync(`${OUTPUT_DIR}${dirname(name)}`, { recursive: true });
  // ファイルを書き込む
  await writeFile(`${OUTPUT_DIR}/${name}.webp`, data.binary);
}

// imagePoolを閉じる
await imagePool.close();

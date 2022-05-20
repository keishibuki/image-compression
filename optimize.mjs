import { ImagePool } from "@squoosh/lib";
import { existsSync, readFileSync, mkdirSync } from "fs";
import { writeFile } from "fs/promises";
import { dirname } from "path";

import showFiles from "./showFiles.mjs";

const IMAGE_DIR = "./images";
const OUTPUT_DIR = "./dist";

// JPEGの圧縮オプション
const jpgEncodeOptions = {
  mozjpeg: { quality: 75 },
};

// PNGの圧縮オプション
const pngEncodeOptions = {
  oxipng: {
    effort: 2,
  },
};

// 前処理（リサイズなど）のオプション
const preprocessOptions = {
  resize: {
    enabled: true,
    width: 1920,
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
const imagePoolList = imageFileList.map((fileName) => {
  const imageFile = readFileSync(`${fileName}`);
  const image = imagePool.ingestImage(imageFile);

  return { name: fileName.replace(IMAGE_DIR.replace("./", ""), ""), image };
});

// 前処理を実行
await Promise.all(
  imagePoolList.map(async (item) => {
    const { image } = item;
    // リサイズなどを処理するためにデコードする
    await image.decoded;
    return await image.preprocess(preprocessOptions);
  })
);

// JPEGならMozJPEGに、PNGならOxipngに圧縮する
await Promise.all(
  imagePoolList.map(async (item) => {
    const { image } = item;
    if (/\.(jpe?g)$/i.test(item.name)) {
      await image.encode(jpgEncodeOptions);
    }
    if (/\.(png)$/i.test(item.name)) {
      await image.encode(pngEncodeOptions);
    }
  })
);

// 圧縮したデータを出力する
for (const item of imagePoolList) {
  const {
    name,
    image: { encodedWith },
  } = item;

  // 圧縮したデータを格納する変数
  let data;

  // JPGならMozJPEGで圧縮したデータを取得
  if (encodedWith.mozjpeg) {
    data = await encodedWith.mozjpeg;
  }
  // PNGならOxiPNGで圧縮したデータを取得
  if (encodedWith.oxipng) {
    data = await encodedWith.oxipng;
  }
  // 出力先フォルダがなければ作成
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR);
  }
  mkdirSync(`${OUTPUT_DIR}${dirname(name)}`, { recursive: true });
  // ファイルを書き込む
  await writeFile(`${OUTPUT_DIR}/${name}`, data.binary);
}

// imagePoolを閉じる
await imagePool.close();

# Silent Control UI

迷わない・疲れない・判断が速い、静的タスク管理アプリ。  
GitHub Pages で動作。サーバーなし。外部 API なし。データは localStorage のみ。

## 主要仕様
- 画面は 3つ: ダッシュボード / 今週 / バックログ
- タスクは最小項目で管理
- 危険度は固定ルールで色分け
- 今週の実行対象は最大 10件
- アニメは 3種のみ（追加 / 並び替え / 完了）

## 使い方（ローカル）
1. Node.js 18+ を用意
2. 依存関係をインストール
   - `npm install`
3. 開発
   - `npm run dev`
4. ビルド
   - `npm run build`
5. プレビュー
   - `npm run preview`

## GitHub Pages にデプロイ
Vite の `base` は `./` にしてあるため、リポジトリ名を気にせず動きます。

手順例:
1. このフォルダをリポジトリに push
2. GitHub の Settings → Pages
3. Build and deployment を GitHub Actions にし、下記の workflow を使う

### 推奨: GitHub Actions（同梱）
- `.github/workflows/deploy.yml` が `main` push で build して Pages に反映します

## データについて
- データ保存: ブラウザの localStorage
- 外部送信: なし（fetch も analytics も使っていません）
- 端末を変えるとデータは移りません（同期なし）

## ライセンス
必要なら任意で追加してください。

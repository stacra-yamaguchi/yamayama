# 作業ルール

## ゲーム画面のバージョン運用（必須）
- 各ゲームを修正した場合は、同じコミット内で画面表示の `Version` と `Last Updated` を必ず更新すること。
- 対象ファイル:
  - `pacman-game/index.html`
  - `tetris-game/index.html`
  - `shooting-game/index.html`
  - `ping-pong/index.html`
  - `rpg-game/index.html`
  - `space-pazzle/index.html`
- 表示フォーマット:
  - `Version x.y.z`
  - `Last Updated: YYYY-MM-DD HH:mm TZ`
- 更新ルール:
  - `Last Updated` は実際の修正日時（タイムゾーン付き）を設定する。
  - `Version` は変更内容に応じて更新する（例: 修正 `PATCH`、機能追加 `MINOR`、大きな変更 `MAJOR`）。

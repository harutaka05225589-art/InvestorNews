# Gitの初期設定（まだしていなければ）
git init
git add .
git commit -m "Initial deploy"
# GitHubで「New Repository」を作成し、そのURLを登録
# (Privateリポジトリ推奨)
git remote add origin https://github.com/harutaka05225589-art/investor-news.git
git branch -M main
git push -u origin main
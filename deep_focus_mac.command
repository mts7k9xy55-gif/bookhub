#!/bin/bash
# Bookhub Deep Focus Engine (1Focus Killer)
# 
# ネットを完全に遮断するのではなく、「気が散る濁流（SNS・動画・ニュース）」のみを
# OSレベル（DNS）で物理的に遮断し、純粋な精神と向き合う時間を作るためのスクリプトです。
# Vercel上のWebアプリからはシステムをロックできないため、ローカルで実行してください。
# ケチくさい課金（フリーミアム）は不要です。完全無料・完全ローカルです。

echo "================================================="
echo "        Bookhub Deep Focus Engine (Mac)          "
echo "================================================="
echo "Entering Deep Focus mode..."
echo "This will block major distracting websites at the OS level."
echo "You will be prompted for your Mac password to modify /etc/hosts."

# The list of domains to block (濁流リスト)
DOMAINS=(
  "youtube.com" "www.youtube.com"
  "twitter.com" "www.twitter.com" "x.com" "www.x.com"
  "facebook.com" "www.facebook.com"
  "instagram.com" "www.instagram.com"
  "reddit.com" "www.reddit.com"
  "news.yahoo.co.jp" "yahoo.co.jp"
  "tiktok.com" "www.tiktok.com"
  "netflix.com" "www.netflix.com"
)

HOSTS_FILE="/etc/hosts"
BACKUP_FILE="/etc/hosts.bookhub.bak"
BLOCK_IP="127.0.0.1"

# Backup original hosts file if it doesn't exist
if [ ! -f "$BACKUP_FILE" ]; then
  sudo cp $HOSTS_FILE $BACKUP_FILE
fi

# Add block markers
sudo bash -c 'echo "" >> /etc/hosts'
sudo bash -c 'echo "# --- BOOKHUB DEEP FOCUS START ---" >> /etc/hosts'

for domain in "${DOMAINS[@]}"; do
  sudo bash -c "echo \"$BLOCK_IP $domain\" >> /etc/hosts"
done

sudo bash -c 'echo "# --- BOOKHUB DEEP FOCUS END ---" >> /etc/hosts'

# Flush DNS Cache (macOS)
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder

echo ""
echo "✅ [LOCKED] Distractions are now physically blocked."
echo "Focus on your text. Open Bookhub in your browser."
echo "https://bookhub-sable.vercel.app/"
echo ""
echo "To unlock and return to the normal internet, press [ENTER] here."
read -p "Waiting for [ENTER]..."

# Unlock process
echo "Unlocking..."
sudo sed -i '' '/# --- BOOKHUB DEEP FOCUS START ---/,/# --- BOOKHUB DEEP FOCUS END ---/d' /etc/hosts

# Flush DNS Cache again
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder

echo "✅ [UNLOCKED] Welcome back to the world."

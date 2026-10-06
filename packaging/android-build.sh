#!/bin/bash
# Odyssey: The Card - Android AAB 빌드 스크립트 (GitHub Actions용)
# 사용법: bash packaging/android-build.sh "앱 이름"
# 이 파일은 git push로 업데이트 가능 (.github/workflows 수정 불필요)
set -e

APP_NAME="${1:-Odyssey: The Card}"
APP_ID="tech.kmskr2000.odyssey"

echo "=== 1. Capacitor 설치 ==="
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/android

echo "=== 2. 웹 에셋 준비 ==="
mkdir -p build
cp index.html build/
cp -r src css assets build/
V=$(date +%s)
echo "{\"v\":$V}" > build/assets/version.json
cd build
sed -i "s|</head>|<script>window.__V=$V;</script>\n</head>|" index.html
sed -i -E "s|href=\"css/style\.css\"|href=\"css/style.css?v=$V\"|" index.html
sed -i -E "s|src=\"src/ui/main\.js\"|src=\"src/ui/main.js?v=$V\"|" index.html
find src -name '*.js' -exec sed -i -E "s|(from '[./][^']*)\.js'|\1.js?v=$V'|g" {} +
cd ..

echo "=== 3. Capacitor init + android 플랫폼 ==="
npx cap init "$APP_NAME" "$APP_ID" --web-dir=build
npx cap add android

echo "=== 4. 앱 아이콘 ==="
if [ -d packaging/android-icons ]; then
  cp -r packaging/android-icons/* android/app/src/main/res/
fi

echo "=== 5. Kotlin stdlib 버전 충돌 해결 ==="
# kotlin-stdlib 1.8.22 vs kotlin-stdlib-jdk7/jdk8 1.6.21 중복 클래스 오류 방지
cat >> android/app/build.gradle << 'EOF'

// Kotlin stdlib 버전 통일 (GitHub Actions 빌드용)
configurations.all {
    resolutionStrategy {
        force 'org.jetbrains.kotlin:kotlin-stdlib:1.8.22'
        force 'org.jetbrains.kotlin:kotlin-stdlib-jdk7:1.8.22'
        force 'org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.8.22'
    }
}
EOF

echo "=== 6. AAB 빌드 ==="
cd android
./gradlew bundleDebug

echo "=== 빌드 완료 ==="
ls -la app/build/outputs/bundle/debug/*.aab

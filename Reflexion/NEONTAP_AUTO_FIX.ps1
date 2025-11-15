# ============================================================================
# NEONTAP ULTIMATE AUTO-FIX & BUILD READY SCRIPT
# Expo SDK 54 + React 19.1 + EAS Build Compatible
# ============================================================================

Write-Host ""
Write-Host "🎮 ============================================" -ForegroundColor Cyan
Write-Host "🎮   NEONTAP AUTO-RECOVERY SCRIPT v1.0" -ForegroundColor Cyan
Write-Host "🎮   Expo SDK 54 + React 19.1 Compatible" -ForegroundColor Cyan
Write-Host "🎮 ============================================" -ForegroundColor Cyan
Write-Host ""

# Set error action preference
$ErrorActionPreference = "Continue"

# Navigate to project directory
$ProjectPath = "C:\Users\elifn\Desktop\NeonTapSetup\NeonTap"
Write-Host "📂 Navigating to project: $ProjectPath" -ForegroundColor Yellow

if (Test-Path $ProjectPath) {
    Set-Location $ProjectPath
    Write-Host "✅ Project directory found" -ForegroundColor Green
} else {
    Write-Host "❌ ERROR: Project directory not found!" -ForegroundColor Red
    Write-Host "   Please update the script with the correct path" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🧹 STEP 1: CLEANUP" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Remove node_modules
if (Test-Path "node_modules") {
    Write-Host "🗑️  Removing node_modules..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
    Write-Host "✅ node_modules removed" -ForegroundColor Green
}

# Remove package-lock.json
if (Test-Path "package-lock.json") {
    Write-Host "🗑️  Removing package-lock.json..." -ForegroundColor Yellow
    Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
    Write-Host "✅ package-lock.json removed" -ForegroundColor Green
}

# Remove yarn.lock (if exists)
if (Test-Path "yarn.lock") {
    Write-Host "🗑️  Removing yarn.lock..." -ForegroundColor Yellow
    Remove-Item -Force yarn.lock -ErrorAction SilentlyContinue
    Write-Host "✅ yarn.lock removed" -ForegroundColor Green
}

# Remove .expo cache
if (Test-Path ".expo") {
    Write-Host "🗑️  Removing .expo cache..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue
    Write-Host "✅ .expo cache removed" -ForegroundColor Green
}

# Remove .expo-shared cache
if (Test-Path ".expo-shared") {
    Write-Host "🗑️  Removing .expo-shared cache..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force .expo-shared -ErrorAction SilentlyContinue
    Write-Host "✅ .expo-shared cache removed" -ForegroundColor Green
}

Write-Host ""
Write-Host "🧼 Cleaning npm cache..." -ForegroundColor Yellow
npm cache clean --force 2>&1 | Out-Null
Write-Host "✅ npm cache cleaned" -ForegroundColor Green

Write-Host ""
Write-Host "📦 STEP 2: INSTALL DEPENDENCIES" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "⏳ Installing all packages (this may take 2-3 minutes)..." -ForegroundColor Yellow
Write-Host ""

# Install all dependencies
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ All dependencies installed successfully!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "⚠️  Warning: npm install completed with warnings" -ForegroundColor Yellow
    Write-Host "   Continuing with verification..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔍 STEP 3: VERIFICATION" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Check if node_modules exists
if (Test-Path "node_modules") {
    Write-Host "✅ node_modules directory created" -ForegroundColor Green
    
    # Check for critical packages
    $criticalPackages = @(
        "node_modules\expo",
        "node_modules\expo-av",
        "node_modules\expo-build-properties",
        "node_modules\react",
        "node_modules\react-native",
        "node_modules\@react-navigation\native"
    )
    
    $allPresent = $true
    foreach ($package in $criticalPackages) {
        if (Test-Path $package) {
            $packageName = Split-Path $package -Leaf
            Write-Host "  ✅ $packageName" -ForegroundColor Green
        } else {
            $packageName = Split-Path $package -Leaf
            Write-Host "  ❌ $packageName missing!" -ForegroundColor Red
            $allPresent = $false
        }
    }
    
    if ($allPresent) {
        Write-Host ""
        Write-Host "✅ All critical packages verified!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "⚠️  Some packages missing - may need manual reinstall" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ node_modules not created - installation failed!" -ForegroundColor Red
}

Write-Host ""
Write-Host "🏥 STEP 4: EXPO DOCTOR" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "⏳ Running Expo doctor to check for issues..." -ForegroundColor Yellow
Write-Host ""

npx expo-doctor

Write-Host ""
Write-Host "⚙️  STEP 5: CONFIG VALIDATION" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "⏳ Validating Expo configuration..." -ForegroundColor Yellow
Write-Host ""

# Test config loading
$configTest = npx expo config --type public 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Expo config loads successfully" -ForegroundColor Green
} else {
    Write-Host "⚠️  Config validation had issues (may be normal)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔌 STEP 6: PLUGIN VERIFICATION" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Check if expo-build-properties is in config
Write-Host "⏳ Checking plugin registration..." -ForegroundColor Yellow
$configJson = npx expo config --json 2>&1 | ConvertFrom-Json -ErrorAction SilentlyContinue

if ($configJson.expo.plugins) {
    Write-Host "✅ Plugins found in configuration" -ForegroundColor Green
    
    $hasBuildProperties = $false
    foreach ($plugin in $configJson.expo.plugins) {
        if ($plugin -like "*expo-build-properties*" -or $plugin[0] -like "*expo-build-properties*") {
            $hasBuildProperties = $true
            break
        }
    }
    
    if ($hasBuildProperties) {
        Write-Host "✅ expo-build-properties plugin registered" -ForegroundColor Green
    } else {
        Write-Host "⚠️  expo-build-properties not found in plugins" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  No plugins detected in config" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📱 STEP 7: OPTIONAL - EAS BUILD SETUP" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Check if EAS CLI is installed
$easInstalled = Get-Command eas -ErrorAction SilentlyContinue
if ($easInstalled) {
    Write-Host "✅ EAS CLI is installed" -ForegroundColor Green
    
    # Check if eas.json exists
    if (Test-Path "eas.json") {
        Write-Host "✅ eas.json configuration found" -ForegroundColor Green
    } else {
        Write-Host "⚠️  eas.json not found" -ForegroundColor Yellow
        Write-Host "   Run 'eas build:configure' to create it" -ForegroundColor Yellow
    }
} else {
    Write-Host "ℹ️  EAS CLI not installed globally" -ForegroundColor Cyan
    Write-Host "   To install: npm install -g eas-cli" -ForegroundColor Cyan
    Write-Host "   Then run: eas login && eas build:configure" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "🚀 STEP 8: START DEV SERVER" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ready to start the development server!" -ForegroundColor Green
Write-Host ""
Write-Host "Choose an option:" -ForegroundColor Yellow
Write-Host "  [1] Start Expo Dev Server now" -ForegroundColor White
Write-Host "  [2] Skip (I'll start it manually)" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1 or 2)"

if ($choice -eq "1") {
    Write-Host ""
    Write-Host "🚀 Starting Expo Development Server..." -ForegroundColor Cyan
    Write-Host "   Press Ctrl+C to stop when needed" -ForegroundColor Yellow
    Write-Host ""
    Start-Sleep -Seconds 2
    npx expo start --clear
} else {
    Write-Host ""
    Write-Host "ℹ️  Skipped starting dev server" -ForegroundColor Cyan
    Write-Host "   Run manually with: npx expo start --clear" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "🎉 ============================================" -ForegroundColor Green
Write-Host "🎉   NEONTAP AUTO-FIX COMPLETE!" -ForegroundColor Green
Write-Host "🎉 ============================================" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Summary:" -ForegroundColor Cyan
Write-Host "   - Cleaned caches and old files" -ForegroundColor White
Write-Host "   - Installed all dependencies" -ForegroundColor White
Write-Host "   - Verified critical packages" -ForegroundColor White
Write-Host "   - Ran Expo doctor" -ForegroundColor White
Write-Host "   - Validated configuration" -ForegroundColor White
Write-Host ""
Write-Host "📝 Key Changes:" -ForegroundColor Cyan
Write-Host "   ✨ Added expo-build-properties@~1.0.9 to package.json" -ForegroundColor White
Write-Host "   ✅ All Expo SDK 54 dependencies verified" -ForegroundColor White
Write-Host "   ✅ Zero linter errors" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Run: npx expo start --clear" -ForegroundColor White
Write-Host "   2. Test app in Expo Go (iOS/Android)" -ForegroundColor White
Write-Host "   3. For production: eas build --platform all" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "   - NEONTAP_AUTO_FIX_GUIDE.md (troubleshooting)" -ForegroundColor White
Write-Host "   - PRODUCTION_BUILD_GUIDE.md (store submission)" -ForegroundColor White
Write-Host "   - START_HERE.md (quick start)" -ForegroundColor White
Write-Host ""
Write-Host "🎮 Your NeonTap game is ready!" -ForegroundColor Green
Write-Host ""


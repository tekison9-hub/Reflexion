# === AutoSplit.ps1 ===
# Bu script Claude'un uzun çıktısını (örnek: ClaudeOutput.txt) okur
# Her "// filename" bloğunu ilgili dosyaya kaydeder

$inputFile = "ClaudeOutput.txt"
$outputRoot = "NeonTap"

# Çıkış klasörünü oluştur
if (!(Test-Path $outputRoot)) { New-Item -ItemType Directory -Path $outputRoot }

# Metni satır satır oku
$lines = Get-Content $inputFile

$currentFile = ""
$currentContent = @()

foreach ($line in $lines) {
    if ($line -match "^//") {
        # Eğer yeni dosya etiketi geldiyse
        if ($line -match "// (.*)\.(js|json|jsx|ts|tsx|css|md)") {
            # Önceki dosyayı kaydet
            if ($currentFile -ne "") {
                $outPath = Join-Path $outputRoot $currentFile
                $outDir = Split-Path $outPath
                if (!(Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force }
                $currentContent | Set-Content $outPath -Encoding utf8
                Write-Host "✅ Saved $currentFile"
            }
            # Yeni dosyaya geç
            $currentFile = $Matches[1] + "." + $Matches[2]
            $currentContent = @()
        }
    } else {
        # Normal kod satırı
        $currentContent += $line
    }
}

# Son dosyayı da kaydet
if ($currentFile -ne "") {
    $outPath = Join-Path $outputRoot $currentFile
    $outDir = Split-Path $outPath
    if (!(Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force }
    $currentContent | Set-Content $outPath -Encoding utf8
    Write-Host "✅ Saved $currentFile (final)"
}

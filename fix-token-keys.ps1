# PowerShell script to fix token key references
$files = Get-ChildItem -Path "frontend\src" -Include "*.tsx","*.ts" -Recurse | Where-Object { $_.FullName -notmatch "node_modules" }

$count = 0
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $newContent = $content -replace "localStorage\.getItem\('token'\)", "localStorage.getItem('auth-token')"
    
    if ($content -ne $newContent) {
        Set-Content -Path $file.FullName -Value $newContent -NoNewline
        $count++
        Write-Host "Fixed: $($file.FullName)"
    }
}

Write-Host "`nTotal files fixed: $count"

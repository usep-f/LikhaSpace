# Deploy the likha-escrow WASM and reflector-mock contract to Stellar testnet
# Writes the output to web\.env.local for the frontend to use.

param([string]$Identity = "likhaspace")

$ErrorActionPreference = "Stop"
$Network = "testnet"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$ReflectorWasm = "target\wasm32v1-none\release\reflector_mock.wasm"
$EscrowWasm = "target\wasm32v1-none\release\likha_escrow.wasm"
$EnvFile = Join-Path $Root "web\.env.local"

Set-Location $Root

# 1. Ensure a funded testnet identity exists
$keys = stellar keys ls
if ($keys -notmatch "\b$Identity\b") {
  Write-Host "Creating + funding testnet identity '$Identity'..."
  stellar keys generate $Identity --network $Network --fund
}

# 2. Build the contracts to wasm
Write-Host "Building contracts..."
stellar contract build

# 3. Deploy Reflector Mock Oracle to testnet
Write-Host "Deploying Reflector Mock Oracle to $Network..."
$OracleId = (stellar contract deploy --wasm $ReflectorWasm --source-account $Identity --network $Network).Trim()
Write-Host "Deployed Oracle ID: $OracleId"

# 4. Install Likha Escrow WASM to testnet
Write-Host "Installing Likha Escrow WASM to $Network..."
$EscrowWasmId = (stellar contract install --wasm $EscrowWasm --source-account $Identity --network $Network).Trim()
Write-Host "Installed Escrow WASM ID: $EscrowWasmId"

# 5. Write to web\.env.local
if (Test-Path $EnvFile) {
  $envContent = Get-Content $EnvFile
  $envContent = $envContent | Where-Object { $_ -notmatch '^NEXT_PUBLIC_ORACLE_ID=' -and $_ -notmatch '^NEXT_PUBLIC_ESCROW_WASM_ID=' -and $_ -notmatch '^NEXT_PUBLIC_CONTRACT_ID=' }
  $envContent | Set-Content $EnvFile
}
Add-Content $EnvFile "NEXT_PUBLIC_ORACLE_ID=$OracleId"
Add-Content $EnvFile "NEXT_PUBLIC_ESCROW_WASM_ID=$EscrowWasmId"
Write-Host ""
Write-Host "Wrote NEXT_PUBLIC_ORACLE_ID=$OracleId and NEXT_PUBLIC_ESCROW_WASM_ID=$EscrowWasmId to web\.env.local"
Write-Host "Restart 'npm run dev' to pick up the new variables."

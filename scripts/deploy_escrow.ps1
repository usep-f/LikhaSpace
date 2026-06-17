# Deploy the likha-escrow WASM and reflector-mock contract to Stellar testnet
# Writes the output to web\.env.local for the frontend to use.

param([string]$Identity = "likhaspace")

$ErrorActionPreference = "Stop"
$Network = "testnet"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$ReflectorWasm = "target\wasm32v1-none\release\reflector_mock.wasm"
$EscrowWasm = "target\wasm32v1-none\release\likha_escrow.wasm"
$ReputationWasm = "target\wasm32v1-none\release\likha_reputation.wasm"
$EnvFile = Join-Path $Root "web\.env.local"

Set-Location $Root

# 1. Ensure a funded testnet identity exists
$keys = stellar keys ls
if ($keys -notmatch "\b$Identity\b") {
  Write-Host "Creating + funding testnet identity '$Identity'..."
  stellar keys generate $Identity --network $Network --fund
}

$AdminAddress = (stellar keys address $Identity).Trim()

# 2. Build the contracts to wasm
Write-Host "Building contracts..."
stellar contract build

# 3. Use Blend Testnet Mock Oracle (which tracks actual native XLM testnet prices)
$OracleId = "CAZOKR2Y5E2OSWSIBRVZMJ47RUTQPIGVWSAQ2UISGAVC46XKPGDG5PKI"
Write-Host "Using Blend Testnet Mock Oracle ID: $OracleId"

# 4. Install Likha Escrow WASM to testnet
Write-Host "Installing Likha Escrow WASM to $Network..."
$EscrowWasmId = (stellar contract install --wasm $EscrowWasm --source-account $Identity --network $Network).Trim()
Write-Host "Installed Escrow WASM ID: $EscrowWasmId"

# 5. Deploy Reputation Contract to testnet
Write-Host "Deploying Reputation Contract to $Network..."
$ReputationId = (stellar contract deploy --wasm $ReputationWasm --source-account $Identity --network $Network).Trim()
Write-Host "Deployed Reputation Contract ID: $ReputationId"

# 6. Initialize Reputation Contract
Write-Host "Initializing Reputation Contract..."
stellar contract invoke --id $ReputationId --source-account $Identity --network $Network -- initialize --admin $AdminAddress

# 7. Write to web\.env.local
if (Test-Path $EnvFile) {
  $envContent = Get-Content $EnvFile
  $envContent = $envContent | Where-Object { $_ -notmatch '^NEXT_PUBLIC_ORACLE_ID=' -and $_ -notmatch '^NEXT_PUBLIC_ESCROW_WASM_ID=' -and $_ -notmatch '^NEXT_PUBLIC_REPUTATION_CONTRACT_ID=' -and $_ -notmatch '^NEXT_PUBLIC_CONTRACT_ID=' }
  $envContent | Set-Content $EnvFile
}
Add-Content $EnvFile "NEXT_PUBLIC_ORACLE_ID=$OracleId"
Add-Content $EnvFile "NEXT_PUBLIC_ESCROW_WASM_ID=$EscrowWasmId"
Add-Content $EnvFile "NEXT_PUBLIC_REPUTATION_CONTRACT_ID=$ReputationId"
Write-Host ""
Write-Host "Wrote NEXT_PUBLIC_ORACLE_ID=$OracleId, NEXT_PUBLIC_ESCROW_WASM_ID=$EscrowWasmId, and NEXT_PUBLIC_REPUTATION_CONTRACT_ID=$ReputationId to web\.env.local"
Write-Host "Restart 'npm run dev' to pick up the new variables."

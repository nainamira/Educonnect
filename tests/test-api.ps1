# Test script for Online Tutoring System API
# Run this script to test the authentication endpoints

$baseUrl = "http://localhost:5000/api"

Write-Host "=== Testing Online Tutoring System API ===" -ForegroundColor Cyan
Write-Host ""

# Generate unique email for testing
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$testEmail = "test$timestamp@example.com"
$testPassword = "testpass123!"
$testName = "Test User"

Write-Host "Using test email: $testEmail" -ForegroundColor Gray
Write-Host ""

# Test 1: Register a new user
Write-Host "1. Testing User Registration..." -ForegroundColor Yellow
$registerData = @{
    email = $testEmail
    password = $testPassword
    confirmPassword = $testPassword
    full_name = $testName
    role = "student"
} | ConvertTo-Json

$token = $null
$registered = $false

try {
    $registerResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method POST -Body $registerData -ContentType "application/json"
    Write-Host "[SUCCESS] Registration successful!" -ForegroundColor Green
    Write-Host "  User ID: $($registerResponse.data.user.id)" -ForegroundColor Gray
    Write-Host "  Email: $($registerResponse.data.user.email)" -ForegroundColor Gray
    Write-Host "  Role: $($registerResponse.data.user.role)" -ForegroundColor Gray
    $token = $registerResponse.data.token
    Write-Host "  Token received: $($token.Substring(0, 20))..." -ForegroundColor Gray
    $registered = $true
    Write-Host ""
} catch {
    $errorMessage = $_.Exception.Message
    if ($_.ErrorDetails.Message) {
        try {
            $errorObj = $_.ErrorDetails.Message | ConvertFrom-Json
            $errorMessage = $errorObj.message
        } catch {
            $errorMessage = $_.ErrorDetails.Message
        }
    }
    
    if ($errorMessage -like "*already registered*" -or $errorMessage -like "*already exists*") {
        Write-Host "[INFO] Email already exists. This is expected if you've run tests before." -ForegroundColor Yellow
        Write-Host "  Continuing with login test using existing account..." -ForegroundColor Gray
        Write-Host ""
        # Use the default test email for login
        $testEmail = "test@example.com"
    } else {
        Write-Host "[ERROR] Registration failed:" -ForegroundColor Red
        Write-Host "  $errorMessage" -ForegroundColor Red
        Write-Host ""
        Write-Host "Continuing with other tests..." -ForegroundColor Yellow
        Write-Host ""
    }
}

# Test 2: Login
Write-Host "2. Testing User Login..." -ForegroundColor Yellow
$loginData = @{
    email = $testEmail
    password = $testPassword
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    Write-Host "[SUCCESS] Login successful!" -ForegroundColor Green
    Write-Host "  User: $($loginResponse.data.user.full_name)" -ForegroundColor Gray
    Write-Host "  Token received: $($loginResponse.data.token.Substring(0, 20))..." -ForegroundColor Gray
    $token = $loginResponse.data.token
    Write-Host ""
} catch {
    Write-Host "[ERROR] Login failed:" -ForegroundColor Red
    $errorMessage = $_.Exception.Message
    if ($_.ErrorDetails.Message) {
        try {
            $errorObj = $_.ErrorDetails.Message | ConvertFrom-Json
            $errorMessage = $errorObj.message
        } catch {
            $errorMessage = $_.ErrorDetails.Message
        }
    }
    Write-Host "  $errorMessage" -ForegroundColor Red
    Write-Host ""
    Write-Host "Skipping protected route test (no valid token)" -ForegroundColor Yellow
    Write-Host ""
    $token = $null
}

# Test 3: Get current user (protected route)
if ($token) {
    Write-Host "3. Testing Get Current User (Protected Route)..." -ForegroundColor Yellow
    $headers = @{
        "Authorization" = "Bearer $token"
    }

    try {
        $meResponse = Invoke-RestMethod -Uri "$baseUrl/auth/me" -Method GET -Headers $headers
        Write-Host "[SUCCESS] Get user info successful!" -ForegroundColor Green
        Write-Host "  User ID: $($meResponse.data.user.id)" -ForegroundColor Gray
        Write-Host "  Email: $($meResponse.data.user.email)" -ForegroundColor Gray
        Write-Host "  Full Name: $($meResponse.data.user.full_name)" -ForegroundColor Gray
        Write-Host "  Role: $($meResponse.data.user.role)" -ForegroundColor Gray
        Write-Host ""
    } catch {
        Write-Host "[ERROR] Get user info failed:" -ForegroundColor Red
        $errorMessage = $_.Exception.Message
        if ($_.ErrorDetails.Message) {
            try {
                $errorObj = $_.ErrorDetails.Message | ConvertFrom-Json
                $errorMessage = $errorObj.message
            } catch {
                $errorMessage = $_.ErrorDetails.Message
            }
        }
        Write-Host "  $errorMessage" -ForegroundColor Red
        Write-Host ""
    }
} else {
    Write-Host "3. Skipping Get Current User test (no valid token)" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "=== All tests completed ===" -ForegroundColor Cyan

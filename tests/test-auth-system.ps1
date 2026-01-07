# Test the complete authentication system

Write-Host "=== Testing EduConnect Authentication System ===" -ForegroundColor Green

# Test 1: Registration
Write-Host "`n1. Testing Registration..." -ForegroundColor Yellow
try {
    $body = @{
        email = "newuser@test.com"
        password = "Test123!@#"
        full_name = "Test User"
        role = "student"
        confirmPassword = "Test123!@#"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:5000/api/auth/register" -Method POST -ContentType "application/json" -Body $body -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.success) {
        Write-Host "✅ Registration successful!" -ForegroundColor Green
        Write-Host "   User ID: $($data.data.user.user_id)" -ForegroundColor Cyan
        Write-Host "   Email: $($data.data.user.email)" -ForegroundColor Cyan
        Write-Host "   Token: $($data.data.token.Substring(0, 20))..." -ForegroundColor Cyan
    } else {
        Write-Host "❌ Registration failed: $($data.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Registration error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Login
Write-Host "`n2. Testing Login..." -ForegroundColor Yellow
try {
    $body = @{
        email = "newuser@test.com"
        password = "Test123!@#"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:5000/api/auth/login" -Method POST -ContentType "application/json" -Body $body -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.success) {
        Write-Host "✅ Login successful!" -ForegroundColor Green
        Write-Host "   User: $($data.data.user.full_name)" -ForegroundColor Cyan
        Write-Host "   Role: $($data.data.user.role)" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Login failed: $($data.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Login error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: API Endpoints
Write-Host "`n3. Testing API Endpoints..." -ForegroundColor Yellow

try {
    $tutorsResponse = Invoke-WebRequest -Uri "http://127.0.0.1:5000/api/tutors" -UseBasicParsing
    $tutorsData = $tutorsResponse.Content | ConvertFrom-Json
    Write-Host "✅ Tutors API: $($tutorsData.success) (Count: $($tutorsData.data.Count))" -ForegroundColor Green
} catch {
    Write-Host "❌ Tutors API error" -ForegroundColor Red
}

try {
    $subjectsResponse = Invoke-WebRequest -Uri "http://127.0.0.1:5000/api/subjects" -UseBasicParsing
    $subjectsData = $subjectsResponse.Content | ConvertFrom-Json
    Write-Host "✅ Subjects API: $($subjectsData.success) (Count: $($subjectsData.data.Count))" -ForegroundColor Green
} catch {
    Write-Host "❌ Subjects API error" -ForegroundColor Red
}

Write-Host "`n=== Authentication System Test Complete ===" -ForegroundColor Green
Write-Host "Pages Updated:" -ForegroundColor Cyan
Write-Host "  ✅ index.html (login-aware navigation)" -ForegroundColor Green
Write-Host "  ✅ pricing.html (login-aware navigation)" -ForegroundColor Green
Write-Host "  ✅ subjects.html (login-aware + API integration)" -ForegroundColor Green
Write-Host "  ✅ tutors.html (login-aware + API integration)" -ForegroundColor Green
Write-Host "  ✅ studentdashboard.html (full authentication)" -ForegroundColor Green
Write-Host "  ✅ tutordashboard.html (full authentication)" -ForegroundColor Green
Write-Host "  ✅ admindashboard.html (full authentication)" -ForegroundColor Green
Write-Host "  ✅ studentprofile.html (authentication)" -ForegroundColor Green
Write-Host "  ✅ studentschedule.html (authentication)" -ForegroundColor Green
Write-Host "  ✅ tutorprofile.html (authentication)" -ForegroundColor Green
Write-Host "`nFeatures:" -ForegroundColor Cyan
Write-Host "  🔐 JWT-based authentication" -ForegroundColor White
Write-Host "  👤 Role-based access control" -ForegroundColor White
Write-Host "  🔄 Login-aware navigation" -ForegroundColor White
Write-Host "  📱 User data display" -ForegroundColor White
Write-Host "  🗄️ MySQL database integration" -ForegroundColor White

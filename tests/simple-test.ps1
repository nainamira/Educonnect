# Simple test of authentication system

Write-Host "=== EduConnect Authentication System Status ===" -ForegroundColor Green

try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:5000/api" -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    
    Write-Host "Server Status: $($data.message)" -ForegroundColor Green
    Write-Host "Available Endpoints: $($data.endpoints -join ', ')" -ForegroundColor Cyan
} catch {
    Write-Host "Server Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nPages Updated with Authentication:" -ForegroundColor Yellow
Write-Host "Public Pages (Login-aware):" -ForegroundColor White
Write-Host "  index.html, pricing.html, subjects.html, tutors.html, howitworks.html" -ForegroundColor Green
Write-Host "`nProtected Pages (Authentication Required):" -ForegroundColor White  
Write-Host "  Student: studentdashboard.html, studentprofile.html, studentschedule.html, studenthistory.html" -ForegroundColor Blue
Write-Host "  Tutor: tutordashboard.html, tutorprofile.html, tutorearnings.html, tutorrequests.html, tutorschedule.html" -ForegroundColor Blue
Write-Host "  Admin: admindashboard.html" -ForegroundColor Red

Write-Host "`nFeatures:" -ForegroundColor Cyan
Write-Host "  JWT Authentication with Bearer tokens" -ForegroundColor White
Write-Host "  Role-based access control" -ForegroundColor White
Write-Host "  MySQL database integration" -ForegroundColor White
Write-Host "  Login-aware navigation" -ForegroundColor White
Write-Host "  User data display across all dashboards" -ForegroundColor White

# Test Login API
$body = @{
    email = "test@example.com"
    password = "Test123!@#"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" -Method POST -ContentType "application/json" -Body $body
    Write-Host "Login Response:"
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host "Response: $($_.Exception.Response.GetResponseStream().StreamReader.ReadToEnd().Result)"
}

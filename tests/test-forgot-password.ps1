# Test Forgot Password API
$body = @{
    email = "test@example.com"
} | ConvertTo-Json

try {
    Write-Host "Testing forgot password for test@example.com..."
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/forgot-password" -Method POST -ContentType "application/json" -Body $body -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    
    Write-Host "Response:"
    $data | ConvertTo-Json -Depth 10
    
    if ($data.resetToken) {
        Write-Host "`nDevelopment reset token: $($data.resetToken)"
        Write-Host "Use this URL: http://localhost:5000/forgotpassword.html?token=$($data.resetToken)"
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host "Response: $($_.Exception.Response.GetResponseStream().StreamReader.ReadToEnd().Result)"
}

# Test if server is accessible
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000" -UseBasicParsing
    Write-Host "✅ Server is accessible!"
    Write-Host "Status Code: $($response.StatusCode)"
    Write-Host "Content Length: $($response.Content.Length)"
} catch {
    Write-Host "❌ Cannot reach server: $($_.Exception.Message)"
}

# Test API endpoint
try {
    $apiResponse = Invoke-WebRequest -Uri "http://localhost:5000/api" -UseBasicParsing
    Write-Host "✅ API is working!"
    $apiResponse.Content | ConvertFrom-Json | ConvertTo-Json -Depth 5
} catch {
    Write-Host "❌ API not accessible: $($_.Exception.Message)"
}

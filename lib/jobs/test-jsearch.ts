/**
 * Utility to test JSearch API connection and debug issues
 * Run this in your terminal: npx tsx lib/jobs/test-jsearch.ts
 */

async function testJSearchAPI() {
  const apiKey = process.env.JSEARCH_API_KEY?.trim()

  if (!apiKey) {
    console.error('❌ JSEARCH_API_KEY not found in .env')
    process.exit(1)
  }

  console.log('🔍 Testing JSearch API Connection...')
  console.log(`API Key (first 20 chars): ${apiKey.substring(0, 20)}...`)

  const JSEARCH_URL = 'https://jsearch.p.rapidapi.com/search'
  const JSEARCH_HOST = 'jsearch.p.rapidapi.com'

  const testQuery = 'React developer'

  const params = new URLSearchParams({
    query: testQuery,
    page: '1',
    num_pages: '1',
    date_posted: 'month',
  })

  const fullUrl = `${JSEARCH_URL}?${params.toString()}`

  console.log('\n📡 Request Details:')
  console.log(`URL: ${fullUrl}`)
  console.log(`Method: GET`)
  console.log(`Headers:`)
  console.log(`  - Accept: application/json`)
  console.log(`  - X-RapidAPI-Key: ${apiKey.substring(0, 20)}...`)
  console.log(`  - X-RapidAPI-Host: ${JSEARCH_HOST}`)

  try {
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': JSEARCH_HOST,
      },
    })

    console.log(`\n📊 Response Status: ${response.status} ${response.statusText}`)

    const contentType = response.headers.get('content-type')
    console.log(`Content-Type: ${contentType}`)

    const body = await response.text()
    console.log(`Response Body: ${body}`)

    if (response.ok) {
      const data = JSON.parse(body)
      console.log(`\n✅ API Connection Successful!`)
      console.log(`Jobs Found: ${data.data?.length || 0}`)
      if (data.data?.[0]) {
        console.log(`Sample Job: ${data.data[0].job_title} at ${data.data[0].employer_name}`)
      }
    } else {
      console.log(`\n❌ API Error: ${response.status}`)
      
      if (response.status === 404) {
        console.log('\n🔧 Troubleshooting 404 Error:')
        console.log('1. The endpoint might be wrong. Check JSearch API docs')
        console.log('2. The API key might not have access to JSearch')
        console.log('3. The RapidAPI subscription might not include JSearch')
        console.log('\nTry these steps:')
        console.log('- Go to https://rapidapi.com/api-sports/api/jsearch')
        console.log('- Check if you\'re subscribed')
        console.log('- Copy your API key from the dashboard')
        console.log('- Update JSEARCH_API_KEY in .env')
      } else if (response.status === 401 || response.status === 403) {
        console.log('\n🔧 Troubleshooting 401/403 Error:')
        console.log('- API key is invalid or expired')
        console.log('- Check your RapidAPI dashboard')
        console.log('- Regenerate the API key if needed')
      }
    }
  } catch (error) {
    console.error('❌ Network Error:', error)
  }
}

testJSearchAPI()

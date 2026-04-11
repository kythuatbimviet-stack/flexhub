import { fetchRevenue } from './app/actions/financial'

async function testFetch() {
    console.log('Testing fetchRevenue...')
    const result = await fetchRevenue()
    if (result.success) {
        console.log('Success! Count:', result.data.length)
        if (result.data.length > 0) {
            console.log('First record sample:', JSON.stringify(result.data[0], null, 2))
        }
    } else {
        console.error('FAILED:', result.error)
    }
}

testFetch()

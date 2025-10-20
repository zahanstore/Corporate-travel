exports.handler = async function(event, context) {
  try {
    console.log('🔍 Testing Airtable connection...');
    
    const airtableUrl = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Bookings`;
    
    // First, let's try to LIST records to test connection
    const listResponse = await fetch(airtableUrl, {
      headers: {
        'Authorization': `Bearer ${process.env.AIRTABLE_ACCESS_TOKEN}`,
      }
    });

    const listResult = await listResponse.json();
    
    if (!listResponse.ok) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          error: `Connection failed: ${listResult.error?.message || listResponse.status}`
        })
      };
    }

    // Now try to create a test record
    const testData = {
      records: [
        {
          fields: {
            'Name': 'Test Connection',
            'Email': 'test@example.com',
            'Phone': '1234567890',
            'Company Name': 'Test Company',
            'Pickup Location': 'Test Location',
            'Destination': 'Test Destination', 
            'Date': '2024-01-01',
            'Time': '12:00',
            'Service Type': 'test',
            'Service Subtype': 'test',
            'Guests': 1,
            'Status': 'Inquired',
            'Notes': 'This is a connection test',
            'Addons': 'WiFi'
          }
        }
      ]
    };

    const createResponse = await fetch(airtableUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AIRTABLE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const createResult = await createResponse.json();
    
    if (!createResponse.ok) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          error: `Create failed: ${createResult.error?.message || createResponse.status}`
        })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: '✅ Airtable connection successful!',
        recordId: createResult.records[0].id,
        existingRecords: listResult.records ? listResult.records.length : 0
      })
    };

  } catch (error) {
    console.error('Test error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: 'Test failed: ' + error.message
      })
    };
  }
};

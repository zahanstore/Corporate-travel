exports.handler = async function(event, context) {
  console.log('🔍 Testing fields one by one');
  
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: {'Access-Control-Allow-Origin': '*'}, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const formData = JSON.parse(event.body);
    
    // Test fields one by one to find which one causes the error
    const testFields = [
      { name: 'Customer', value: formData.name || 'Test Customer' },
      { name: 'Customer Email', value: formData.email || 'test@example.com' },
      { name: 'Pickup Location', value: formData.pickup || 'Test Location' },
      { name: 'Dropoff Location', value: formData.destination || 'Test Destination' },
      { name: 'Status', value: 'Inquired' }
    ];
    
    let problematicField = null;
    
    // Test each field individually
    for (const field of testFields) {
      console.log(`Testing field: ${field.name}`);
      
      const testData = {
        records: [
          {
            fields: {
              [field.name]: field.value
            }
          }
        ]
      };

      const response = await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Bookings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.AIRTABLE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      });

      const result = await response.json();
      
      if (!response.ok) {
        problematicField = field.name;
        console.log(`❌ Field "${field.name}" failed:`, result.error);
        break;
      } else {
        console.log(`✅ Field "${field.name}" works`);
        // Delete the test record
        await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Bookings/${result.records[0].id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${process.env.AIRTABLE_ACCESS_TOKEN}`,
          }
        });
      }
    }

    if (problematicField) {
      throw new Error(`Problematic field: "${problematicField}" - This is likely a linked record field`);
    }

    // If all individual fields work, try the full record
    console.log('All individual fields work, trying full record...');
    
    const fullData = {
      records: [
        {
          fields: {
            'Customer': formData.name || 'Test Customer',
            'Customer Email': formData.email || 'test@example.com',
            'Pickup Location': formData.pickup || 'Test Location',
            'Dropoff Location': formData.destination || 'Test Destination',
            'Status': 'Inquired'
          }
        }
      ]
    };

    const fullResponse = await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Bookings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AIRTABLE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fullData)
    });

    const fullResult = await fullResponse.json();
    
    if (!fullResponse.ok) {
      throw new Error('Full record failed: ' + JSON.stringify(fullResult.error));
    }

    return {
      statusCode: 200,
      headers: {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
      body: JSON.stringify({ 
        success: true, 
        message: 'All fields work! Record created.',
        recordId: fullResult.records[0].id
      })
    };

  } catch (error) {
    console.error('Error:', error.message);
    return {
      statusCode: 500,
      headers: {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
      body: JSON.stringify({ 
        success: false,
        error: error.message
      })
    };
  }
};

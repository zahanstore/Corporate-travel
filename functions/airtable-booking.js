exports.handler = async function(event, context) {
  console.log('🚀 Minimal Airtable function');
  
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: {'Access-Control-Allow-Origin': '*'}, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const formData = JSON.parse(event.body);
    
    const airtableData = {
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

    const response = await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Bookings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AIRTABLE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(airtableData)
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(JSON.stringify(result.error));
    }

    return {
      statusCode: 200,
      headers: {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
      body: JSON.stringify({ 
        success: true, 
        message: 'Booking created!',
        recordId: result.records[0].id
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
      body: JSON.stringify({ 
        success: false,
        error: 'Failed: ' + error.message
      })
    };
  }
};

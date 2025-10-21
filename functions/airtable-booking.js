exports.handler = async function(event, context) {
  console.log('🚀 Airtable function - Using Notes for customer info');
  
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: {'Access-Control-Allow-Origin': '*'}, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const formData = JSON.parse(event.body);
    
    // Put all customer info in Notes since Customer field is linked
    const airtableData = {
      records: [
        {
          fields: {
            // Skip 'Customer' field (it's a linked record)
            'Customer Email': formData.email || 'Not provided',
            'Pickup Location': formData.pickup || 'Not provided',
            'Dropoff Location': formData.destination || 'Not provided',
            'Pickup Date/Time': `${formData.date} ${formData.time}` || 'Not provided',
            'Status': 'Inquired',
            'Notes': `CUSTOMER: ${formData.name || 'Not provided'} | Phone: ${formData.phone || 'Not provided'} | Company: ${formData.company || 'Not provided'} | Service: ${formData.service || 'Not provided'} | Guests: ${formData.guests || '1'} | Service Option: ${formData.service_subtype || 'Not selected'} | Addons: ${formData.addons?.join(', ') || 'None'} | Message: ${formData.message || 'No message'}`
            // Skip other linked record fields: 'Assigned Vehicle', 'Assigned Driver', 'Service'
          }
        }
      ]
    };

    console.log('📤 Sending to Airtable:', JSON.stringify(airtableData, null, 2));

    const response = await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Bookings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AIRTABLE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(airtableData)
    });

    const result = await response.json();
    
    console.log('📨 Response status:', response.status);
    console.log('📨 Response:', JSON.stringify(result, null, 2));
    
    if (!response.ok) {
      throw new Error(JSON.stringify(result.error));
    }

    return {
      statusCode: 200,
      headers: {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
      body: JSON.stringify({ 
        success: true, 
        message: '✅ Booking created successfully!',
        recordId: result.records[0].id
      })
    };

  } catch (error) {
    console.error('Error:', error.message);
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

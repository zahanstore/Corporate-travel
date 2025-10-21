exports.handler = async function(event, context) {
  console.log('🚀 Airtable function - Date in Notes');
  
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: {'Access-Control-Allow-Origin': '*'}, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const formData = JSON.parse(event.body);
    
    // Only use basic text fields, put everything else in Notes
    const airtableData = {
      records: [
        {
          fields: {
            'Pickup Location': formData.pickup || 'Not provided',
            'Dropoff Location': formData.destination || 'Not provided',
            'Status': 'Inquired',
            'Notes': `DATE/TIME: ${formData.date} ${formData.time} | CUSTOMER: ${formData.name || 'Not provided'} | EMAIL: ${formData.email || 'Not provided'} | PHONE: ${formData.phone || 'Not provided'} | COMPANY: ${formData.company || 'Not provided'} | SERVICE: ${formData.service || 'Not provided'} | GUESTS: ${formData.guests || '1'} | SERVICE OPTION: ${formData.service_subtype || 'Not selected'} | ADDONS: ${formData.addons?.join(', ') || 'None'} | MESSAGE: ${formData.message || 'No message'}`
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
    
    if (!response.ok) {
      throw new Error(JSON.stringify(result.error));
    }

    console.log('✅ Record created! ID:', result.records[0].id);

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
